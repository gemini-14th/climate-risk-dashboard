const db = require('../db/connection');

const getRiskData = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         p.county,
         p.total_population,
         p.at_risk_population,
         p.risk_level,
         p.flood_risk,
         p.drought_spi,
         f.risk_score    AS flood_score,
         f.risk_level    AS flood_level,
         f.rainfall_score,
         f.elevation_score,
         f.soil_score
       FROM population_risk p
       LEFT JOIN flood_risk_scores f ON f.county = p.county
       ORDER BY p.county`
    );

    if (rows.length === 0) {
      return res.status(503).json({
        error: 'Risk data not yet available. Pipeline running — try in 2 minutes.'
      });
    }

    const counties = rows.reduce((acc, row) => {
      acc[row.county] = {
        floodRisk:    row.flood_level || row.flood_risk,
        floodScore:   row.flood_score ? parseFloat(row.flood_score) : null,
        droughtSPI:   parseFloat(row.drought_spi),
        population:   row.at_risk_population,
        totalPop:     row.total_population,
        riskLevel:    row.risk_level,
        breakdown: row.flood_score ? {
          rainfall:  parseFloat(row.rainfall_score),
          elevation: parseFloat(row.elevation_score),
          soil:      parseFloat(row.soil_score)
        } : null
      };
      return acc;
    }, {});

    const highAndCritical = rows.filter(
      r => ['HIGH','CRITICAL'].includes(r.flood_level || r.flood_risk)
    );

    // Get average 24h rainfall from weather_data
    const [rainRows] = await db.execute(
      `SELECT ROUND(AVG(rainfall_mm)) AS avg_rain
       FROM weather_data WHERE forecast_date = CURDATE()`
    );

    const summary = {
      rainfall24h:      parseInt(rainRows[0]?.avg_rain) || 0,
      droughtSPI:       parseFloat(
        rows.sort((a,b) => a.drought_spi - b.drought_spi)[0]?.drought_spi || 0
      ),
      highRiskCounties: highAndCritical.length,
      totalAtRisk:      rows.reduce((s, r) => s + r.at_risk_population, 0)
    };

    res.json({ summary, counties });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRiskData };
