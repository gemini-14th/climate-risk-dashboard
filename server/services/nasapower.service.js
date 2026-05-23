const axios = require('axios');
const { KENYA_COUNTIES } = require('../data/kenyaCounties');
const db = require('../db/connection');

const NASA_POWER_URL = 'https://power.larc.nasa.gov/api/temporal/monthly/point';

/**
 * Fetches 30-year monthly rainfall climatology for one county
 * from the NASA POWER API.
 */
const fetchCountyBaseline = async (county) => {
  const response = await axios.get(NASA_POWER_URL, {
    params: {
      parameters: 'PRECTOTCORR',
      community:  'AG',
      longitude:  county.lon,
      latitude:   county.lat,
      start:      1993,
      end:        2022,
      format:     'JSON'
    },
    timeout: 30000
  });

  const monthly = response.data?.properties?.parameter?.PRECTOTCORR;
  if (!monthly) throw new Error(`No PRECTOTCORR data for ${county.name}`);

  const byMonth = {};
  for (const [key, value] of Object.entries(monthly)) {
    if (value === -999) continue;
    const month = parseInt(key.slice(4), 10);
    const daysInMonth = new Date(parseInt(key.slice(0, 4)), month, 0).getDate();
    const monthlyMm = value * daysInMonth;
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(monthlyMm);
  }

  return Object.entries(byMonth).map(([month, values]) => {
    const mean   = values.reduce((a, b) => a + b, 0) / values.length;
    const stddev = Math.sqrt(
      values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
    );
    return {
      month:     parseInt(month),
      mean_mm:   parseFloat(mean.toFixed(2)),
      stddev_mm: parseFloat(stddev.toFixed(2))
    };
  });
};

/**
 * Fetches and stores baselines for ALL 47 counties.
 * Runs once — results are stored in climate_baselines table.
 */
const fetchAndStoreAllBaselines = async () => {
  console.log('[NASA POWER] Starting baseline fetch for all 47 counties...');
  const BATCH_SIZE = 5;
  let successCount = 0;

  for (let i = 0; i < KENYA_COUNTIES.length; i += BATCH_SIZE) {
    const batch = KENYA_COUNTIES.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (county) => {
      try {
        const [existing] = await db.execute(
          'SELECT COUNT(*) AS cnt FROM climate_baselines WHERE county = ?',
          [county.name]
        );
        if (existing[0].cnt >= 12) {
          console.log(`[NASA POWER] Skipping ${county.name} — baselines exist.`);
          successCount++;
          return;
        }

        const baselines = await fetchCountyBaseline(county);

        for (const { month, mean_mm, stddev_mm } of baselines) {
          await db.execute(
            `INSERT INTO climate_baselines
               (county, \`month\`, mean_mm, stddev_mm, data_years)
             VALUES (?, ?, ?, ?, 30)
             ON DUPLICATE KEY UPDATE
               mean_mm = VALUES(mean_mm),
               stddev_mm = VALUES(stddev_mm),
               fetched_at = NOW()`,
            [county.name, month, mean_mm, stddev_mm]
          );
        }

        console.log(`[NASA POWER] Stored baselines for ${county.name}.`);
        successCount++;
      } catch (err) {
        console.error(`[NASA POWER] Failed for ${county.name}:`, err.message);
      }
    }));

    if (i + BATCH_SIZE < KENYA_COUNTIES.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`[NASA POWER] Baseline fetch complete. ${successCount}/47 counties stored.`);
};

/**
 * Fetches the 3-month baseline for a specific county and season.
 */
const get3MonthBaseline = async (countyName, month) => {
  const months = [
    ((month - 2 + 12) % 12) + 1,
    month,
    (month % 12) + 1
  ];

  const [rows] = await db.execute(
    'SELECT `month`, mean_mm, stddev_mm FROM climate_baselines WHERE county = ? AND `month` IN (?, ?, ?)',
    [countyName, ...months]
  );

  if (rows.length === 0) return null;

  const mean_mm   = rows.reduce((s, r) => s + parseFloat(r.mean_mm), 0);
  const stddev_mm = Math.sqrt(
    rows.reduce((s, r) => s + Math.pow(parseFloat(r.stddev_mm), 2), 0)
  );

  return {
    mean_mm:   parseFloat(mean_mm.toFixed(2)),
    stddev_mm: parseFloat(stddev_mm.toFixed(2))
  };
};

module.exports = {
  fetchAndStoreAllBaselines,
  get3MonthBaseline,
  fetchCountyBaseline
};
