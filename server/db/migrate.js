const db = require('./connection');

/**
 * Auto-create all required tables on startup.
 * Uses CREATE TABLE IF NOT EXISTS — safe to run repeatedly.
 * This removes the need to manually import schema.sql on Railway.
 */
const runMigrations = async () => {
  console.log('[Migrate] Running auto-migration...');

  const statements = [
    // ── weather_data ──
    `CREATE TABLE IF NOT EXISTS weather_data (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      county        VARCHAR(100) NOT NULL,
      forecast_date DATE         NOT NULL,
      rainfall_mm   DECIMAL(6,2) NOT NULL DEFAULT 0,
      fetched_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_county_date (county, forecast_date),
      INDEX idx_county_date (county, forecast_date)
    )`,

    // ── drought_index ──
    `CREATE TABLE IF NOT EXISTS drought_index (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      county          VARCHAR(100)  NOT NULL,
      spi_value       DECIMAL(5,2)  NOT NULL,
      spi_period      TINYINT       NOT NULL DEFAULT 3,
      calculated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_county (county)
    )`,

    // ── alerts ──
    `CREATE TABLE IF NOT EXISTS alerts (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      county      VARCHAR(100)  NOT NULL,
      alert_type  ENUM('FLOOD','DROUGHT','HEAT','LANDSLIDE') NOT NULL,
      severity    ENUM('WATCH','WARNING','CRITICAL')          NOT NULL,
      title       VARCHAR(200)  NOT NULL,
      description TEXT          NOT NULL,
      is_active   BOOLEAN       DEFAULT TRUE,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_county_type (county, alert_type)
    )`,

    // ── population_risk ──
    `CREATE TABLE IF NOT EXISTS population_risk (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      county              VARCHAR(100) NOT NULL,
      total_population    INT          NOT NULL,
      at_risk_population  INT          NOT NULL,
      risk_level          ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL,
      flood_risk          ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL,
      drought_spi         DECIMAL(5,2) NOT NULL,
      calculated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_county (county)
    )`,

    // ── climate_baselines (NASA POWER 30-year data) ──
    `CREATE TABLE IF NOT EXISTS climate_baselines (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      county        VARCHAR(100)  NOT NULL,
      \`month\`       TINYINT       NOT NULL,
      mean_mm       DECIMAL(7,2)  NOT NULL,
      stddev_mm     DECIMAL(7,2)  NOT NULL,
      data_years    SMALLINT      NOT NULL DEFAULT 30,
      fetched_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_county_month (county, \`month\`)
    )`,

    // ── spi_history (monthly SPI trend) ──
    `CREATE TABLE IF NOT EXISTS spi_history (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      county        VARCHAR(100)  NOT NULL,
      year_month    CHAR(7)       NOT NULL,
      spi_value     DECIMAL(5,2)  NOT NULL,
      recorded_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_county_ym (county, year_month)
    )`,

    // ── flood_risk_scores (weighted composite 0-100) ──
    `CREATE TABLE IF NOT EXISTS flood_risk_scores (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      county            VARCHAR(100)  NOT NULL,
      risk_score        DECIMAL(5,2)  NOT NULL,
      risk_level        ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL,
      rainfall_score    DECIMAL(5,2)  NOT NULL,
      elevation_score   DECIMAL(5,2)  NOT NULL,
      soil_score        DECIMAL(5,2)  NOT NULL,
      calculated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_county (county)
    )`
  ];

  for (const sql of statements) {
    try {
      await db.execute(sql);
    } catch (err) {
      console.error('[Migrate] Failed:', err.message);
      throw err;
    }
  }

  console.log('[Migrate] All 7 tables verified/created.');
};

module.exports = { runMigrations };
