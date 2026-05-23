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

    // Fallback: fetch live (only happens if DB is empty)
    const fresh = await fetchRainfallForecast();
    const nairobiData = fresh.find(f => f.county === 'Nairobi');
    res.json(nairobiData?.forecast || []);
  } catch (error) {
    next(error);
  }
};

module.exports = { getForecast };
