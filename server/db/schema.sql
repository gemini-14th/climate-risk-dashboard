-- Schema for ClimateWatch Kenya
-- Local:  mysql -u root -p climate_dashboard < schema.sql
-- Railway: mysql -h <HOST> -P <PORT> -u root -p railway < schema.sql

CREATE TABLE IF NOT EXISTS weather_data (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  county        VARCHAR(100) NOT NULL,
  forecast_date DATE         NOT NULL,
  rainfall_mm   DECIMAL(6,2) NOT NULL DEFAULT 0,
  fetched_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_county_date (county, forecast_date),
  INDEX idx_county_date (county, forecast_date)
);

CREATE TABLE IF NOT EXISTS drought_index (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  county          VARCHAR(100)  NOT NULL,
  spi_value       DECIMAL(5,2)  NOT NULL,
  spi_period      TINYINT       NOT NULL DEFAULT 3,
  calculated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_county (county)
);

CREATE TABLE IF NOT EXISTS alerts (
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
);

CREATE TABLE IF NOT EXISTS population_risk (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  county              VARCHAR(100) NOT NULL,
  total_population    INT          NOT NULL,
  at_risk_population  INT          NOT NULL,
  risk_level          ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL,
  flood_risk          ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL,
  drought_spi         DECIMAL(5,2) NOT NULL,
  calculated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_county (county)
);

-- Phase 3: 30-year monthly rainfall baselines from NASA POWER
CREATE TABLE IF NOT EXISTS climate_baselines (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  county        VARCHAR(100)  NOT NULL,
  month         TINYINT       NOT NULL COMMENT '1=Jan, 12=Dec',
  mean_mm       DECIMAL(7,2)  NOT NULL,
  stddev_mm     DECIMAL(7,2)  NOT NULL,
  data_years    SMALLINT      NOT NULL DEFAULT 30,
  fetched_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_county_month (county, month)
);

-- Phase 3: Monthly SPI history for trend graphs
CREATE TABLE IF NOT EXISTS spi_history (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  county        VARCHAR(100)  NOT NULL,
  year_month    CHAR(7)       NOT NULL COMMENT 'Format: YYYY-MM',
  spi_value     DECIMAL(5,2)  NOT NULL,
  recorded_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_county_month (county, year_month)
);

-- Phase 3: Weighted flood risk scores (0-100)
CREATE TABLE IF NOT EXISTS flood_risk_scores (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  county            VARCHAR(100)  NOT NULL,
  risk_score        DECIMAL(5,2)  NOT NULL COMMENT '0-100 weighted score',
  risk_level        ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL,
  rainfall_score    DECIMAL(5,2)  NOT NULL COMMENT 'Rainfall sub-score 0-40',
  elevation_score   DECIMAL(5,2)  NOT NULL COMMENT 'Elevation sub-score 0-30',
  soil_score        DECIMAL(5,2)  NOT NULL COMMENT 'Soil+slope sub-score 0-30',
  calculated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_county (county)
);
