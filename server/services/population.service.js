const { COUNTY_LOOKUP } = require('../data/kenyaCounties');

/**
 * Estimates at-risk population for each county.
 *
 * Logic:
 *   HIGH flood risk    → 25% of total population at risk
 *   MODERATE flood risk → 10% of total population at risk
 *   LOW flood risk     → 2%  of total population at risk
 *
 *   If drought is SEVERE or EXTREME, add 15% of population
 *   to the at-risk count (drought affects more people than
 *   direct flood inundation in pastoral counties).
 *
 * All population figures are from the 2019 KNBS census.
 *
 * @param {Array} riskResults - [{ county, floodRisk, droughtSPI, droughtClass }]
 * @returns {Array} [{ county, totalPopulation, atRiskPopulation, riskLevel }]
 */
const estimateAtRiskPopulation = (riskResults) => {
  return riskResults.map(({ county, floodRisk, droughtClass }) => {
    const countyData = COUNTY_LOOKUP[county];
    if (!countyData) return null;

    const total = countyData.population;

    const FLOOD_RISK_RATES = { HIGH: 0.25, MODERATE: 0.10, LOW: 0.02 };
    const DROUGHT_EXTRA    = { EXTREME: 0.20, SEVERE: 0.15, MODERATE: 0.08, NORMAL: 0 };

    const floodAtRisk   = Math.round(total * (FLOOD_RISK_RATES[floodRisk]  || 0));
    const droughtAtRisk = Math.round(total * (DROUGHT_EXTRA[droughtClass]  || 0));

    // Cap at total population — avoid double-counting by taking the max,
    // not the sum (a person can only be "at risk" once)
    const atRisk = Math.min(total, Math.max(floodAtRisk, droughtAtRisk));

    return {
      county,
      totalPopulation:   total,
      atRiskPopulation:  atRisk,
      riskLevel:         floodRisk,
      floodRisk,
      droughtClass
    };
  }).filter(Boolean);
};

/**
 * Returns national totals.
 * @param {Array} populationResults - output of estimateAtRiskPopulation()
 */
const getNationalSummary = (populationResults) => ({
  totalAtRisk:      populationResults.reduce((s, c) => s + c.atRiskPopulation, 0),
  highRiskCounties: populationResults.filter(c => c.riskLevel === 'HIGH').length,
  totalPopulation:  populationResults.reduce((s, c) => s + c.totalPopulation, 0)
});

module.exports = { estimateAtRiskPopulation, getNationalSummary };
