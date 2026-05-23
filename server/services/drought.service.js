const { SPI_BASELINES } = require('../data/kenyaCounties');
const { get3MonthBaseline } = require('./nasapower.service');
const db = require('../db/connection');

const DAYS_IN_3_MONTHS = 90;
const FORECAST_DAYS    = 7;

/**
 * Calculates SPI for a single county using NASA POWER baselines
 * when available, falling back to hardcoded SPI_BASELINES otherwise.
 */
const calculateSPI = async (observedWeeklyMm, countyName) => {
  const currentMonth = new Date().getMonth() + 1;

  // Try NASA POWER baseline first
  let baseline = await get3MonthBaseline(countyName, currentMonth);

  // If NASA POWER not yet populated, use hardcoded fallback
  if (!baseline) {
    const fallback = SPI_BASELINES[countyName];
    if (!fallback) return 0;
    baseline = { mean_mm: fallback.mean, stddev_mm: fallback.stdDev };
  }

  // Scale weekly observed to 3-month estimate
  const observed3Month = observedWeeklyMm * (DAYS_IN_3_MONTHS / FORECAST_DAYS);

  if (baseline.stddev_mm === 0) return 0;
  return parseFloat(
    ((observed3Month - baseline.mean_mm) / baseline.stddev_mm).toFixed(2)
  );
};

/**
 * Calculates SPI for all counties and stores monthly history.
 * @param {Array} forecastResults - output of fetchRainfallForecast()
 * @returns {Array} [{ county, spi, classification }]
 */
const calculateAllSPIs = async (forecastResults) => {
  const results = await Promise.all(
    forecastResults.map(async ({ county, forecast }) => {
      const weeklyTotal    = forecast.reduce((s, d) => s + d.rainfall, 0);
      const spi            = await calculateSPI(weeklyTotal, county);
      const classification = classifyDrought(spi);
      return { county, spi, classification };
    })
  );

  // Store monthly SPI history
  const yearMonth = new Date().toISOString().slice(0, 7);
  for (const { county, spi } of results) {
    await db.execute(
      'INSERT INTO spi_history (county, `year_month`, spi_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE spi_value = VALUES(spi_value)',
      [county, yearMonth, spi]
    );
  }

  return results;
};

/**
 * Returns 6-month SPI history for a county (for trend chart).
 */
const getSPIHistory = async (countyName) => {
  const [rows] = await db.execute(
    'SELECT `year_month`, spi_value FROM spi_history WHERE county = ? ORDER BY `year_month` DESC LIMIT 6',
    [countyName]
  );
  return rows.reverse();
};

const classifyDrought = (spi) => {
  if (spi < -2.0) return 'EXTREME';
  if (spi < -1.5) return 'SEVERE';
  if (spi < -1.0) return 'MODERATE';
  return 'NORMAL';
};

module.exports = { calculateSPI, calculateAllSPIs, classifyDrought, getSPIHistory };
