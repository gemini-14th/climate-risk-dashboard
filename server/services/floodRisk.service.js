const { COUNTY_LOOKUP, SOIL_DRAINAGE, SLOPE_CLASS } = require('../data/kenyaCounties');
const db = require('../db/connection');

const RAINFALL_SCORES = [
  { max: 0,   pts: 0  },
  { max: 19,  pts: 8  },
  { max: 34,  pts: 16 },
  { max: 49,  pts: 28 },
  { max: 74,  pts: 36 },
  { max: Infinity, pts: 40 }
];

const ELEVATION_SCORES = [
  { min: 2000, pts: 0  },
  { min: 1500, pts: 6  },
  { min: 1000, pts: 12 },
  { min: 500,  pts: 20 },
  { min: 100,  pts: 26 },
  { min: 0,    pts: 30 }
];

const SOIL_SLOPE_MATRIX = {
  POOR:     { FLAT: 30, GENTLE: 25, STEEP: 22 },
  MODERATE: { FLAT: 18, GENTLE: 14, STEEP: 16 },
  GOOD:     { FLAT: 10, GENTLE:  8, STEEP: 20 }
};

const getRainfallScore = (peakRainfall) => {
  for (const { max, pts } of RAINFALL_SCORES) {
    if (peakRainfall <= max) return pts;
  }
  return 40;
};

const getElevationScore = (elevation) => {
  for (const { min, pts } of ELEVATION_SCORES) {
    if (elevation >= min) return pts;
  }
  return 30;
};

const getSoilSlopeScore = (countyName) => {
  const soil  = SOIL_DRAINAGE[countyName]  || 'MODERATE';
  const slope = SLOPE_CLASS[countyName]    || 'GENTLE';
  return SOIL_SLOPE_MATRIX[soil]?.[slope] ?? 14;
};

const scoreToLevel = (score) => {
  if (score >= 80) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 30) return 'MODERATE';
  return 'LOW';
};

/**
 * Computes weighted flood risk score for one county.
 */
const computeFloodRiskScore = (countyName, forecastData) => {
  const peakRainfall = Math.max(...forecastData.map(d => d.rainfall));
  const elevation    = COUNTY_LOOKUP[countyName]?.elevation_m || 1000;

  const rainfallScore  = getRainfallScore(peakRainfall);
  const elevationScore = getElevationScore(elevation);
  const soilScore      = getSoilSlopeScore(countyName);

  const totalScore = parseFloat(
    (rainfallScore * 0.40 + elevationScore * 0.30 + soilScore * 0.30).toFixed(1)
  );

  return {
    score:     totalScore,
    level:     scoreToLevel(totalScore),
    breakdown: {
      rainfall:  parseFloat((rainfallScore  * 0.40).toFixed(1)),
      elevation: parseFloat((elevationScore * 0.30).toFixed(1)),
      soil:      parseFloat((soilScore      * 0.30).toFixed(1))
    }
  };
};

/**
 * Computes and stores flood risk scores for all counties.
 */
const computeAndStoreAllScores = async (forecastResults) => {
  const results = forecastResults.map(({ county, forecast }) => ({
    county,
    ...computeFloodRiskScore(county, forecast)
  }));

  for (const { county, score, level, breakdown } of results) {
    await db.execute(
      `INSERT INTO flood_risk_scores
         (county, risk_score, risk_level, rainfall_score, elevation_score, soil_score)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         risk_score      = VALUES(risk_score),
         risk_level      = VALUES(risk_level),
         rainfall_score  = VALUES(rainfall_score),
         elevation_score = VALUES(elevation_score),
         soil_score      = VALUES(soil_score),
         calculated_at   = NOW()`,
      [county, score, level, breakdown.rainfall, breakdown.elevation, breakdown.soil]
    );
  }

  return results;
};

module.exports = {
  computeFloodRiskScore,
  computeAndStoreAllScores,
  scoreToLevel
};
