/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates Standard Pivot Points and their support/resistance levels.
 * Pivot points for period `i` are calculated using High, Low, Close from period `i-1`.
 *
 * Formulas:
 * PP = (Prev_High + Prev_Low + Prev_Close) / 3
 * S1 = (PP * 2) - Prev_High
 * R1 = (PP * 2) - Prev_Low
 * S2 = PP - (Prev_High - Prev_Low)
 * R2 = PP + (Prev_High - Prev_Low)
 * S3 = Prev_Low - 2 * (Prev_High - PP)  // Common variant
 * R3 = Prev_High + 2 * (PP - Prev_Low)  // Common variant
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Requires 'high', 'low', 'close'.
 *                           Must have at least 2 data points to calculate pivots for the second point.
 * @returns {IndicatorOutput} Array of Pivot Point values. Each point contains a `values` object:
 *          `{ pp: number, s1: number, r1: number, s2: number, r2: number, s3: number, r3: number }`.
 *          Output starts from the second data point (index 1), using data from index 0.
 *          The timestamp of the output corresponds to the day the pivots are FOR.
 */
function calculatePivotPoints(data) {
  if (!data || data.length < 2) {
    return []; // Need at least two data points (previous day for current day's pivots)
  }

  const pivotPointsOutput = [];

  for (let i = 1; i < data.length; i++) {
    const prevHigh = data[i - 1].high;
    const prevLow = data[i - 1].low;
    const prevClose = data[i - 1].close;

    const pp = (prevHigh + prevLow + prevClose) / 3;
    const s1 = (pp * 2) - prevHigh;
    const r1 = (pp * 2) - prevLow;
    const s2 = pp - (prevHigh - prevLow);
    const r2 = pp + (prevHigh - prevLow);
    // Using common S3/R3 formulas based on PP and range/volatility from PP
    const s3 = pp - 2 * (prevHigh - prevLow); // Another common one: prevLow - 2 * (prevHigh - pp); let's stick to range from PP.
                                           // Let's use the one from the prompt: S3 = Prev_Low - 2 * (Prev_High - PP)
                                           // R3 = Prev_High + 2 * (PP - Prev_Low)
    // The prompt has:
    // S3 = L_prev - 2 * (H_prev - PP)
    // R3 = H_prev + 2 * (PP - L_prev)
    // This is what I'll use.

    const s3_calc = prevLow - 2 * (prevHigh - pp);
    const r3_calc = prevHigh + 2 * (pp - prevLow);
    
    pivotPointsOutput.push({
      timestamp: data[i].timestamp, // Pivots are for the current day `i`
      values: {
        pp: pp,
        s1: s1,
        r1: r1,
        s2: s2,
        r2: r2,
        s3: s3_calc,
        r3: r3_calc,
      },
    });
  }

  return pivotPointsOutput;
}

module.exports = { calculatePivotPoints };

console.log("Pivot Points function defined in financial-indicators/lib/indicators/pivot_points.js");
