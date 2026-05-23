const db = require('../db/connection');

const DroughtIndex = {
  async bulkInsert(spiResults) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const { county, spi } of spiResults) {
        await conn.execute(
          `INSERT INTO drought_index (county, spi_value, spi_period)
           VALUES (?, ?, 3)
           ON DUPLICATE KEY UPDATE spi_value = VALUES(spi_value), calculated_at = NOW()`,
          [county, spi]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getLatest() {
    const [rows] = await db.execute(
      `SELECT county, spi_value, calculated_at
       FROM drought_index
       ORDER BY county`
    );
    return rows;
  }
};

module.exports = DroughtIndex;
