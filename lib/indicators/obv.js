/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates On-Balance Volume (OBV).
 * Rules:
 * - If Close(today) > Close(yesterday), OBV(today) = OBV(yesterday) + Volume(today).
 * - If Close(today) < Close(yesterday), OBV(today) = OBV(yesterday) - Volume(today).
 * - If Close(today) == Close(yesterday), OBV(today) = OBV(yesterday).
 * The OBV for the first data point is set to 0.
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Requires 'close' and 'volume'.
 * @returns {IndicatorOutput} Array of OBV values. The length is equal to the input data length.
 */
function calculateOBV(data) {
  if (!data || data.length === 0) {
    return [];
  }

  const obvValues = [];
  let previousObv = 0;

  // Set OBV for the first data point to 0.
  obvValues.push({
    timestamp: data[0].timestamp,
    value: 0,
  });

  // Calculate OBV for subsequent data points
  for (let i = 1; i < data.length; i++) {
    let currentObv = previousObv;
    if (data[i].close > data[i - 1].close) {
      currentObv += data[i].volume;
    } else if (data[i].close < data[i - 1].close) {
      currentObv -= data[i].volume;
    }
    // If close is equal, OBV remains previousObv, which is already set.
    
    obvValues.push({
      timestamp: data[i].timestamp,
      value: currentObv,
    });
    previousObv = currentObv;
  }

  return obvValues;
}

module.exports = { calculateOBV };

console.log("OBV function defined in financial-indicators/lib/indicators/obv.js");
