/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates the Accumulation/Distribution Line (A/D Line).
 * 1. Money Flow Multiplier (MFM) = [(Close - Low) - (High - Close)] / (High - Low)
 *    If High == Low, MFM = 0.
 * 2. Money Flow Volume (MFV) = MFM * Volume
 * 3. A/D Line = Previous A/D Line + Current MFV
 *    The first A/D value is the MFV of the first period.
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Requires 'high', 'low', 'close', 'volume'.
 * @returns {IndicatorOutput} Array of A/D Line values. The length is equal to the input data length.
 */
function calculateADLine(data) {
  if (!data || data.length === 0) {
    return [];
  }

  const adLineValues = [];
  let cumulativeADL = 0;

  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const { high, low, close, volume } = point;

    let mfm = 0; // Money Flow Multiplier
    const range = high - low;

    if (range !== 0) {
      mfm = ((close - low) - (high - close)) / range;
    } 
    // If range is 0, MFM remains 0. This handles cases where H=L (and thus C must be H and L).
    // Some definitions might use previous MFM or other rules if H=L=C, but MFM=0 is common.

    const mfv = mfm * volume; // Money Flow Volume

    if (i === 0) {
      cumulativeADL = mfv; // First A/D value is the MFV of the first period
    } else {
      cumulativeADL += mfv;
    }
    
    adLineValues.push({
      timestamp: point.timestamp,
      value: cumulativeADL,
    });
  }

  return adLineValues;
}

module.exports = { calculateADLine };

console.log("Accumulation/Distribution Line function defined in financial-indicators/lib/indicators/ad_line.js");
