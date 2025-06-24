/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates the Rate of Change (ROC).
 * ROC = [(Current Close - Close N periods ago) / (Close N periods ago)] * 100
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} [period=12] - The lookback period (N).
 * @param {string} [source='close'] - The source property from OHLCVData (e.g., 'close').
 * @returns {IndicatorOutput} Array of ROC values.
 *          Output starts from data[period].
 */
function calculateROC(data, period = 12, source = 'close') {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }

  if (data.length <= period) {
    return []; // Not enough data points to calculate ROC
  }

  const rocValues = [];

  for (let i = period; i < data.length; i++) {
    const currentClose = data[i][source];
    const closeNPeriodsAgo = data[i - period][source];

    let roc = 0;
    if (closeNPeriodsAgo !== 0) {
      roc = ((currentClose - closeNPeriodsAgo) / closeNPeriodsAgo) * 100;
    } else {
      // If the close N periods ago was 0:
      // - If current close is also 0, ROC is 0% change.
      // - If current close is positive, ROC is effectively infinite positive change.
      // - If current close is negative (not typical for prices), ROC is infinite negative.
      // For simplicity and to avoid Infinity in output, treat as very large or specific value.
      // Or, if prices can't be 0, this case is theoretical.
      // Let's return Infinity if currentClose is non-zero, and 0 if currentClose is also 0.
      // Charting libraries might struggle with Infinity. A large number or null might be better.
      // For now, let's stick to the direct math and potential Infinity.
      if (currentClose === 0) {
        roc = 0;
      } else {
        roc = currentClose > 0 ? Infinity : -Infinity; 
      }
    }
    
    rocValues.push({
      timestamp: data[i].timestamp,
      value: roc,
    });
  }

  return rocValues;
}

module.exports = { calculateROC };

console.log("ROC function defined in financial-indicators/lib/indicators/roc.js");
