const cron = require('node-cron');
const { fetchRainfallForecast, getAverageRainfall24h } = require('../services/openmeteo.service');
const { calculateAllSPIs }        = require('../services/drought.service');
const { estimateAtRiskPopulation } = require('../services/population.service');
const { classifyFloodRisk }       = require('../utils/riskClassifier');
const { fetchAndStoreAllBaselines } = require('../services/nasapower.service');
const { computeAndStoreAllScores }  = require('../services/floodRisk.service');
const WeatherData    = require('../models/WeatherData');
const DroughtIndex   = require('../models/DroughtIndex');
const Alert          = require('../models/Alert');
const db             = require('../db/connection');
const { COUNTY_LOOKUP } = require('../data/kenyaCounties');

const FLOOD_THRESHOLDS    = { HIGH: 50, MODERATE: 35 };
const DROUGHT_THRESHOLDS  = { CRITICAL: -2.0, WARNING: -1.5, WATCH: -1.0 };

/**
 * Core data pipeline. Runs every 6 hours.
 * Steps:
 *   1. Fetch rainfall from Open-Meteo for all 47 counties
 *   2. Store in weather_data table
 *   3. Calculate SPI for each county (now async — uses NASA POWER baselines)
 *   3b. Compute advanced flood risk scores
 *   4. Store in drought_index table
 *   5. Compute flood risk per county
 *   6. Estimate at-risk populations
 *   7. Store in population_risk table
 *   8. Auto-generate or deactivate alerts
 */
const runDataPipeline = async () => {
  const startTime = Date.now();
  console.log(`\n[DataFetcher] Pipeline started at ${new Date().toISOString()}`);

  try {
    // ── Step 1 & 2: Rainfall ──────────────────────────────
    console.log('[DataFetcher] Fetching rainfall forecasts...');
    const forecastResults = await fetchRainfallForecast();
    await WeatherData.bulkInsert(forecastResults);
    console.log(`[DataFetcher] Stored rainfall data for ${forecastResults.length} counties.`);

    // ── Step 3 & 4: SPI (now async — uses NASA POWER) ────
    console.log('[DataFetcher] Calculating drought indices...');
    const spiResults = await calculateAllSPIs(forecastResults);
    await DroughtIndex.bulkInsert(spiResults);
    console.log('[DataFetcher] Drought indices stored.');

    // ── Step 3b: Advanced flood risk scores ───────────────
    console.log('[DataFetcher] Computing advanced flood risk scores...');
    const floodScores = await computeAndStoreAllScores(forecastResults);
    console.log(`[DataFetcher] Flood risk scores stored for ${floodScores.length} counties.`);

    // ── Step 5 & 6: Risk + Population ────────────────────
    console.log('[DataFetcher] Computing risk scores and population estimates...');
    const riskAndPop = forecastResults.map((f) => {
      const spiEntry  = spiResults.find(s => s.county === f.county) || { spi: 0, classification: 'NORMAL' };
      const floodEntry = floodScores.find(fl => fl.county === f.county);
      const floodRisk  = floodEntry?.level || 'LOW';

      return {
        county:       f.county,
        floodRisk,
        droughtSPI:   spiEntry.spi,
        droughtClass: spiEntry.classification
      };
    });

    // ── Step 7: Store population risk ────────────────────
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const r of riskAndPop) {
        const countyData = COUNTY_LOOKUP[r.county];
        if (!countyData) continue;
        const RATES = { CRITICAL: 0.35, HIGH: 0.25, MODERATE: 0.10, LOW: 0.02 };
        const DROUGHT_EXTRA = { EXTREME: 0.20, SEVERE: 0.15, MODERATE: 0.08, NORMAL: 0 };
        const atRisk = Math.min(
          countyData.population,
          Math.max(
            Math.round(countyData.population * (RATES[r.floodRisk] || 0)),
            Math.round(countyData.population * (DROUGHT_EXTRA[r.droughtClass] || 0))
          )
        );
        await conn.execute(
          `INSERT INTO population_risk
             (county, total_population, at_risk_population, risk_level, flood_risk, drought_spi)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             total_population   = VALUES(total_population),
             at_risk_population = VALUES(at_risk_population),
             risk_level         = VALUES(risk_level),
             flood_risk         = VALUES(flood_risk),
             drought_spi        = VALUES(drought_spi),
             calculated_at      = NOW()`,
          [r.county, countyData.population, atRisk, r.floodRisk, r.floodRisk, r.droughtSPI]
        );
      }
      await conn.commit();
    } finally {
      conn.release();
    }

    // ── Step 8: Alerts ────────────────────────────────────
    console.log('[DataFetcher] Generating alerts...');
    for (const r of riskAndPop) {
      const { county, floodRisk, droughtSPI, droughtClass } = r;
      const countyPop = COUNTY_LOOKUP[county]?.population || 0;
      const atRiskEst = Math.round(countyPop * (floodRisk === 'HIGH' || floodRisk === 'CRITICAL' ? 0.25 : 0.10));

      // Flood alerts
      if (floodRisk === 'CRITICAL' || floodRisk === 'HIGH') {
        await Alert.upsert({
          county, type: 'FLOOD', severity: 'CRITICAL',
          title: 'Flood Warning',
          description: `Severe rainfall forecast. Approx. ${atRiskEst.toLocaleString()} residents at risk. Evacuation of low-lying areas advised.`
        });
      } else if (floodRisk === 'MODERATE') {
        await Alert.upsert({
          county, type: 'FLOOD', severity: 'WARNING',
          title: 'Flood Watch',
          description: `Above-threshold rainfall forecast. Approx. ${atRiskEst.toLocaleString()} residents in moderate risk zones.`
        });
      } else {
        await Alert.deactivate(county, 'FLOOD');
      }

      // Drought alerts
      if (droughtSPI < DROUGHT_THRESHOLDS.CRITICAL) {
        await Alert.upsert({
          county, type: 'DROUGHT', severity: 'CRITICAL',
          title: 'Extreme Drought Emergency',
          description: `SPI-3 of ${droughtSPI} indicates extreme drought. NDMA emergency protocols apply.`
        });
      } else if (droughtSPI < DROUGHT_THRESHOLDS.WARNING) {
        await Alert.upsert({
          county, type: 'DROUGHT', severity: 'WARNING',
          title: 'Drought Alert',
          description: `SPI-3 of ${droughtSPI} indicates severe drought. Pasture and water reserves critically low.`
        });
      } else if (droughtSPI < DROUGHT_THRESHOLDS.WATCH) {
        await Alert.upsert({
          county, type: 'DROUGHT', severity: 'WATCH',
          title: 'Drought Watch',
          description: `SPI-3 of ${droughtSPI} indicates moderate drought conditions developing.`
        });
      } else {
        await Alert.deactivate(county, 'DROUGHT');
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[DataFetcher] Pipeline complete in ${elapsed}s.\n`);

  } catch (err) {
    console.error('[DataFetcher] Pipeline failed:', err.message);
  }
};

const startDataFetcherJob = () => {
  // Fetch NASA POWER baselines once on first boot.
  // Subsequent boots skip counties that already have baselines.
  fetchAndStoreAllBaselines().catch(err =>
    console.error('[NASA POWER] Baseline fetch error:', err.message)
  );

  // Run pipeline immediately on server start
  runDataPipeline();

  // Then run every 6 hours: 00:00, 06:00, 12:00, 18:00 EAT
  cron.schedule('0 */6 * * *', runDataPipeline);
  console.log('[DataFetcher] Cron job scheduled — runs every 6 hours.');
};

module.exports = { startDataFetcherJob, runDataPipeline };
