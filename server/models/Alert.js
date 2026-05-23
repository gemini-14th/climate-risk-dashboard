const db = require('../db/connection');

const Alert = {
  async upsert({ county, type, severity, title, description }) {
    await db.execute(
      `INSERT INTO alerts (county, alert_type, severity, title, description, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         severity    = VALUES(severity),
         title       = VALUES(title),
         description = VALUES(description),
         is_active   = TRUE,
         updated_at  = NOW()`,
      [county, type, severity, title, description]
    );
  },

  // Deactivate alerts for counties no longer breaching thresholds
  async deactivate(county, type) {
    await db.execute(
      `UPDATE alerts SET is_active = FALSE WHERE county = ? AND alert_type = ?`,
      [county, type]
    );
  },

  async getActive() {
    const [rows] = await db.execute(
      `SELECT id, county, county AS location, alert_type AS type, severity, title, description, created_at AS timestamp
       FROM alerts
       WHERE is_active = TRUE
       ORDER BY
         FIELD(severity, 'CRITICAL', 'WARNING', 'WATCH'),
         updated_at DESC`
    );
    return rows;
  }
};

module.exports = Alert;
