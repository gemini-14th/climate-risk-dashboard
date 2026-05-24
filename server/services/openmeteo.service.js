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
  const results = [];

  for (const county of KENYA_COUNTIES) {
    try {
      const response = await axios.get(OPEN_METEO_URL, {
        params: {
          latitude:      county.lat,
          longitude:     county.lon,
          daily:         'precipitation_sum',
          timezone:      'Africa/Nairobi',
          forecast_days: 7
        },
        timeout: 10000
      });

      const { daily } = response.data;
      const forecast = daily.time.map((dateStr, idx) => ({
        day:      new Date(dateStr).toLocaleDateString('en-KE', { weekday: 'short' }),
        date:     dateStr,
        rainfall: Math.round(daily.precipitation_sum[idx] ?? 0)
      }));

      results.push({ county: county.name, lat: county.lat, lon: county.lon, forecast });
    } catch (err) {
      console.error(`Open-Meteo failed for ${county.name}:`, err.message);
      
      // Retry logic for 429 errors
      if (err.response?.status === 429) {
        console.log('Open-Meteo rate limited. Waiting 5 seconds before retrying...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Simple 1-time retry
        try {
          const response = await axios.get(OPEN_METEO_URL, {
            params: {
              latitude:      county.lat,
              longitude:     county.lon,
              daily:         'precipitation_sum',
              timezone:      'Africa/Nairobi',
              forecast_days: 7
            },
            timeout: 10000
          });
          const { daily } = response.data;
          const forecast = daily.time.map((dateStr, idx) => ({
            day:      new Date(dateStr).toLocaleDateString('en-KE', { weekday: 'short' }),
            date:     dateStr,
            rainfall: Math.round(daily.precipitation_sum[idx] ?? 0)
          }));
          results.push({ county: county.name, lat: county.lat, lon: county.lon, forecast });
          continue; // Successfully retried, continue to delay
        } catch (retryErr) {
          console.error(`Open-Meteo retry failed for ${county.name}:`, retryErr.message);
        }
      }

      // Return zero-rainfall fallback so one failure doesn't break the whole process
      results.push({
        county: county.name, lat: county.lat, lon: county.lon,
        forecast: Array.from({ length: 7 }, (_, i) => ({
          day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
          date: null, rainfall: 0
        }))
      });
    }

    // 1000ms pause between requests to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
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
