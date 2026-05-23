/**
 * Classify flood risk based on rainfall, SPI, and elevation.
 * @param {number} rainfall - 24h rainfall in mm
 * @param {number} spi - Standardized Precipitation Index
 * @param {number} elevation - Elevation in meters
 * @returns {string} "HIGH" | "MODERATE" | "LOW"
 */
export function classifyFloodRisk(rainfall, spi, elevation) {
  if (rainfall > 50 && elevation < 500) return 'HIGH';
  if (rainfall > 35 && elevation < 1000) return 'HIGH';
  if (rainfall > 25 && elevation < 1500) return 'MODERATE';
  return 'LOW';
}

/**
 * Classify drought severity based on SPI value.
 * @param {number} spi - Standardized Precipitation Index
 * @returns {string} "EXTREME" | "SEVERE" | "MODERATE" | "NORMAL"
 */
export function classifyDrought(spi) {
  if (spi < -2.0) return 'EXTREME';
  if (spi < -1.5) return 'SEVERE';
  if (spi < -1.0) return 'MODERATE';
  return 'NORMAL';
}

/**
 * Map a risk level to its corresponding colour hex.
 * Supports Phase 3 CRITICAL level.
 * @param {string} riskLevel - "CRITICAL" | "HIGH" | "MODERATE" | "LOW"
 * @returns {string} Hex colour string
 */
export function riskToColour(riskLevel) {
  const colours = {
    CRITICAL: '#dc2626',
    HIGH:     '#ef4444',
    MODERATE: '#f59e0b',
    LOW:      '#4ade80',
  };
  return colours[riskLevel] || '#64748b';
}

/**
 * Determine bar colour for rainfall chart based on mm value.
 * @param {number} rainfall - Rainfall in mm
 * @returns {string} Hex colour string
 */
export function getBarColour(rainfall) {
  if (rainfall >= 75) return '#dc2626';
  if (rainfall >= 50) return '#ef4444';
  if (rainfall >= 35) return '#f59e0b';
  if (rainfall >= 20) return '#38bdf8';
  return '#4ade80';
}
