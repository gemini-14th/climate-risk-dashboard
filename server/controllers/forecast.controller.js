const WeatherData = require('../models/WeatherData');
const { fetchRainfallForecast } = require('../services/openmeteo.service');

const getForecast = async (req, res, next) => {
  try {
    // Try cached DB data first
    const grouped = await WeatherData.getGroupedByCounty();

    if (Object.keys(grouped).length > 0) {
      // Return first county's 7-day forecast as the national headline
      // (frontend can request county-specific data via query param later)
      const county = req.query.county || 'Nairobi';
      return res.json(grouped[county] || Object.values(grouped)[0] || []);
    }

    // Fallback: If DB is empty (pipeline still running), return empty array
    // instead of fetching all 47 counties on the fly which takes 47-60 seconds and causes timeouts.
    return res.json([]);
  } catch (error) {
    next(error);
  }
};

module.exports = { getForecast };
