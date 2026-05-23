const db = require('../db/connection');

const WeatherData = {
  // Insert or update forecast rows for a county
  async bulkInsert(forecastResults) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const { county, forecast } of forecastResults) {
        for (const { date, rainfall } of forecast) {
          if (!date) continue;
          await conn.execute(
            `INSERT INTO weather_data (county, forecast_date, rainfall_mm)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE rainfall_mm = VALUES(rainfall_mm), fetched_at = NOW()`,
            [county, date, rainfall]
          );
        }
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Get the 7 most recent forecast rows per county
  async getLatest() {
    const [rows] = await db.execute(
      `SELECT county, forecast_date, rainfall_mm
       FROM weather_data
       WHERE forecast_date >= CURDATE()
       ORDER BY county, forecast_date
       LIMIT 329`  // 47 counties × 7 days
    );
    return rows;
  },

  // Returns grouped by county: { "Nairobi": [{ date, rainfall }, ...], ... }
  async getGroupedByCounty() {
    const rows = await this.getLatest();
    return rows.reduce((acc, row) => {
      if (!acc[row.county]) acc[row.county] = [];
      acc[row.county].push({
        day:      new Date(row.forecast_date).toLocaleDateString('en-KE', { weekday: 'short' }),
        date:     row.forecast_date,
        rainfall: parseFloat(row.rainfall_mm)
      });
      return acc;
    }, {});
  }
};

module.exports = WeatherData;
