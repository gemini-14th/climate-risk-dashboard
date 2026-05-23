const db = require('../db/connection');
const { getSPIHistory } = require('../services/drought.service');
const { COUNTY_LOOKUP, SOIL_DRAINAGE, SLOPE_CLASS } = require('../data/kenyaCounties');

/**
 * GET /api/county/:name
 * Returns full detail for a single county.
 */
const getCountyDetail = async (req, res, next) => {
  try {
    const countyName = req.params.name
      .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const meta = COUNTY_LOOKUP[countyName];
    if (!meta) return res.status(404).json({ error: `County "${countyName}" not found.` });

    // 7-day forecast
    const [forecast] = await db.execute(
      `SELECT forecast_date AS date, rainfall_mm AS rainfall
       FROM weather_data
       WHERE county = ? AND forecast_date >= CURDATE()
       ORDER BY forecast_date LIMIT 7`,
      [countyName]
    );

    // Flood risk score + breakdown
    const [floodRows] = await db.execute(
      `SELECT risk_score, risk_level, rainfall_score, elevation_score, soil_score
       FROM flood_risk_scores WHERE county = ?`,
      [countyName]
    );
    const flood = floodRows[0] || null;

    // Current drought index
    const [droughtRows] = await db.execute(
      'SELECT spi_value FROM drought_index WHERE county = ?',
      [countyName]
    );
    const currentSPI = droughtRows[0]?.spi_value ?? null;

    // 6-month SPI history
    const spiHistory = await getSPIHistory(countyName);

    // Population
    const [popRows] = await db.execute(
      `SELECT total_population, at_risk_population, risk_level
       FROM population_risk WHERE county = ?`,
      [countyName]
    );
    const pop = popRows[0] || null;

    // Active alerts for this county
    const [alertRows] = await db.execute(
      `SELECT alert_type AS type, severity, title, description, updated_at AS timestamp
       FROM alerts WHERE county = ? AND is_active = TRUE`,
      [countyName]
    );

    res.json({
      county:      countyName,
      countyCode:  meta.county_code,
      geography: {
        area_km2:    meta.area_km2,
        elevation_m: meta.elevation_m,
        density:     meta.density,
        soil:        SOIL_DRAINAGE[countyName] || 'UNKNOWN',
        slope:       SLOPE_CLASS[countyName]   || 'UNKNOWN'
      },
      forecast:   forecast.map(f => ({
        date:     f.date,
        day:      new Date(f.date).toLocaleDateString('en-KE', { weekday: 'short' }),
        rainfall: parseFloat(f.rainfall)
      })),
      floodRisk: flood ? {
        score:     parseFloat(flood.risk_score),
        level:     flood.risk_level,
        breakdown: {
          rainfall:  parseFloat(flood.rainfall_score),
          elevation: parseFloat(flood.elevation_score),
          soil:      parseFloat(flood.soil_score)
        }
      } : null,
      drought: {
        currentSPI: currentSPI !== null ? parseFloat(currentSPI) : null,
        history:    spiHistory
      },
      population: pop ? {
        total:      pop.total_population,
        atRisk:     pop.at_risk_population,
        riskLevel:  pop.risk_level,
        atRiskPct:  parseFloat(
          ((pop.at_risk_population / pop.total_population) * 100).toFixed(1)
        )
      } : null,
      alerts: alertRows
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getCountyDetail };
