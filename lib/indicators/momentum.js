/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates the Momentum (MOM).
 * Momentum = Current Price - Price N periods ago
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} [period=10] - The lookback period (N).
 * @param {string} [source='close'] - The source property from OHLCVData (e.g., 'close').
 * @returns {IndicatorOutput} Array of Momentum values.
 *          Output starts from data[period].
 */
function calculateMomentum(data, period = 10, source = 'close') {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }

  if (data.length <= period) {
    return []; // Not enough data points to calculate Momentum
  }

  const momentumValues = [];

  for (let i = period; i < data.length; i++) {
    const currentPrice = data[i][source];
    const priceNPeriodsAgo = data[i - period][source];

    const momentum = currentPrice - priceNPeriodsAgo;
    
    momentumValues.push({
      timestamp: data[i].timestamp,
      value: momentum,
    });
  }

  return momentumValues;
}

module.exports = { calculateMomentum };

console.log("Momentum function defined in financial-indicators/lib/indicators/momentum.js");
