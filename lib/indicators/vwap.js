/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates the Volume Weighted Average Price (VWAP).
 * VWAP = Cumulative (Typical Price * Volume) / Cumulative Volume
 * Typical Price (TP) = (High + Low + Close) / 3
 * This implementation calculates a VWAP cumulative since the beginning of the provided data.
 * It does not reset daily unless the provided data itself represents a single day.
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Requires 'high', 'low', 'close', 'volume'.
 * @returns {IndicatorOutput} Array of VWAP values. The length is equal to the input data length.
 */
function calculateVWAP(data) {
  if (!data || data.length === 0) {
    return [];
  }

  const vwapValues = [];
  let cumulativeTpVol = 0; // Cumulative (Typical Price * Volume)
  let cumulativeVolume = 0;

  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const { high, low, close, volume } = point;

    const typicalPrice = (high + low + close) / 3;
    const tpVol = typicalPrice * volume;

    cumulativeTpVol += tpVol;
    cumulativeVolume += volume;

    let vwap = 0;
    if (cumulativeVolume !== 0) {
      vwap = cumulativeTpVol / cumulativeVolume;
    } else {
      // If cumulative volume is 0 (e.g., all volumes so far were 0), VWAP is undefined or TP.
      // Using TP of the current period is a common way to handle this for the first point if volume is 0.
      // Or, if it's not the first point and cumulative volume became 0 due to negative volumes (not typical),
      // it's an edge case. For positive volumes, cumulativeVolume will only be 0 if all volumes are 0.
      vwap = typicalPrice; // Or 0, or handle as an error/NaN depending on requirements.
                           // If all volumes are 0, TP seems a reasonable value for VWAP.
    }
    
    vwapValues.push({
      timestamp: point.timestamp,
      value: vwap,
    });
  }

  return vwapValues;
}

module.exports = { calculateVWAP };

console.log("VWAP function defined in financial-indicators/lib/indicators/vwap.js");
