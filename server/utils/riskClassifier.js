const classifyFloodRisk = (rainfall, spi, elevation) => {
  if (rainfall > 50 && elevation < 500)  return 'HIGH';
  if (rainfall > 35 && elevation < 1000) return 'HIGH';
  if (rainfall > 25 && elevation < 1500) return 'MODERATE';
  return 'LOW';
};

const classifyDrought = (spi) => {
  if (spi < -2.0) return 'EXTREME';
  if (spi < -1.5) return 'SEVERE';
  if (spi < -1.0) return 'MODERATE';
  return 'NORMAL';
};

module.exports = { classifyFloodRisk, classifyDrought };
