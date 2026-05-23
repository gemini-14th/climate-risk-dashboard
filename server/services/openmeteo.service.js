const axios = require('axios');
const { KENYA_COUNTIES } = require('../data/kenyaCounties');

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetches 7-day daily precipitation forecast for all 47 counties.
 * Open-Meteo is free and requires no API key.
 * Batches counties in groups of 10 to avoid rate limit issues.
 *
 * Returns: Array of { county, lat, lon, forecast: [{ day, date, rainfall }] }
 */
const fetchRainfallForecast = async () => {
  const BATCH_SIZE = 3;
  const results = [];

  for (let i = 0; i < KENYA_COUNTIES.length; i += BATCH_SIZE) {
    const batch = KENYA_COUNTIES.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (county) => {
        try {
          const response = await axios.get(OPEN_METEO_URL, {
            params: {
              latitude:      county.lat,
              longitude:     county.lon,
              daily:         'precipitation_sum',
              timezone:      'Africa/Nairobi',
              forecast_days: 7
            },
            timeout: 8000
          });

          const { daily } = response.data;
          const forecast = daily.time.map((dateStr, idx) => ({
            day:      new Date(dateStr).toLocaleDateString('en-KE', { weekday: 'short' }),
            date:     dateStr,
            rainfall: Math.round(daily.precipitation_sum[idx] ?? 0)
          }));

          return { county: county.name, lat: county.lat, lon: county.lon, forecast };
        } catch (err) {
          console.error(`Open-Meteo failed for ${county.name}:`, err.message);
          // Return zero-rainfall fallback so one failure doesn't break the whole batch
          return {
            county: county.name, lat: county.lat, lon: county.lon,
            forecast: Array.from({ length: 7 }, (_, i) => ({
              day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
              date: null, rainfall: 0
            }))
          };
        }
      })
    );

    results.push(...batchResults);

    // 1500ms pause between batches — respectful of Open-Meteo's fair-use policy
    if (i + BATCH_SIZE < KENYA_COUNTIES.length) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  return results;
};

/**
 * Returns the aggregate 24-hour rainfall across all counties.
 * Used for the top MetricCard value.
 */
const getAverageRainfall24h = (forecastResults) => {
  const totals = forecastResults.map(r => r.forecast[0]?.rainfall || 0);
  return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
};

module.exports = { fetchRainfallForecast, getAverageRainfall24h };
