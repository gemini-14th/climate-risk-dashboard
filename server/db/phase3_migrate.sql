-- Phase 3 migration — run AFTER schema.sql

CREATE TABLE IF NOT EXISTS climate_baselines (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  county        VARCHAR(100)  NOT NULL,
  `month`       TINYINT       NOT NULL,
  mean_mm       DECIMAL(7,2)  NOT NULL,
  stddev_mm     DECIMAL(7,2)  NOT NULL,
  data_years    SMALLINT      NOT NULL DEFAULT 30,
  fetched_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_county_month (county, `month`)
);

CREATE TABLE IF NOT EXISTS spi_history (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  county        VARCHAR(100)  NOT NULL,
  `year_month`  CHAR(7)       NOT NULL,
  spi_value     DECIMAL(5,2)  NOT NULL,
  recorded_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_county_ym (county, `year_month`)
);

CREATE TABLE IF NOT EXISTS flood_risk_scores (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  county            VARCHAR(100)  NOT NULL,
  risk_score        DECIMAL(5,2)  NOT NULL,
  risk_level        ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL,
  rainfall_score    DECIMAL(5,2)  NOT NULL,
  elevation_score   DECIMAL(5,2)  NOT NULL,
  soil_score        DECIMAL(5,2)  NOT NULL,
  calculated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_county (county)
);

ALTER TABLE population_risk MODIFY COLUMN risk_level ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL;
ALTER TABLE population_risk MODIFY COLUMN flood_risk ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL;
