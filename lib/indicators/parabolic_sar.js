/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').OHLCVDataPoint} OHLCVDataPoint
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates the Parabolic Stop and Reverse (SAR).
 *
 * Rules for SAR calculation:
 * SAR(today) = SAR(yesterday) + AF * (EP - SAR(yesterday))
 * - EP (Extreme Point): Highest high of current uptrend, or lowest low of current downtrend.
 * - AF (Acceleration Factor): Starts at `initialAf` (e.g., 0.02), increases by `incrementAf`
 *   each time a new EP is recorded, up to `maxAf` (e.g., 0.20).
 *
 * Trend Reversal:
 * - Uptrend: If today's SAR > today's Low, trend reverses to downtrend. SAR for tomorrow is set to current EP (highest high).
 * - Downtrend: If today's SAR < today's High, trend reverses to uptrend. SAR for tomorrow is set to current EP (lowest low).
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Must have at least 2 points.
 * @param {number} [initialAf=0.02] - Initial acceleration factor.
 * @param {number} [incrementAf=0.02] - Increment for the acceleration factor.
 * @param {number} [maxAf=0.20] - Maximum value for the acceleration factor.
 * @returns {IndicatorOutput} Array of SAR values. Each point has a `values` object:
 *                            `{ sar: number, isBelowPrice: boolean }`.
 *                            `sar` is the Parabolic SAR value.
 *                            `isBelowPrice` is true if the SAR value is below the low of the current period.
 */
function calculateParabolicSAR(data, initialAf = 0.02, incrementAf = 0.02, maxAf = 0.20) {
  if (data.length < 2) {
    return []; // Not enough data to determine initial trend or calculate SAR
  }
  if (initialAf <= 0 || incrementAf <= 0 || maxAf <= 0 || initialAf > maxAf) {
    throw new Error("Invalid AF parameters. Ensure they are positive and initialAf <= maxAf.");
  }

  const sarValues = [];
  let isUptrend = true; // Initial assumption, will be determined by first two points
  let af = initialAf;
  let ep; // Extreme Point
  let sar;

  // Initialize based on the first available data point (or first two)
  // The common practice is to start SAR calculation from the second point,
  // using the first point to establish initial EP and SAR.
  // Or, assume trend based on close[1] vs close[0]

  // Determine initial trend from first two data points (data[0] and data[1])
  if (data[1].close > data[0].close) {
    isUptrend = true;
    ep = data[1].high; // Highest high of the current uptrend
    sar = data[0].low;  // SAR for data[1] is the low of data[0]
  } else {
    isUptrend = false;
    ep = data[1].low;   // Lowest low of the current downtrend
    sar = data[0].high; // SAR for data[1] is the high of data[0]
  }
  
  // The first SAR value corresponds to data[1]
  sarValues.push({ 
    timestamp: data[1].timestamp, 
    values: { sar: sar, isBelowPrice: sar < data[1].low }
  });


  for (let i = 2; i < data.length; i++) {
    const prevSar = sar;
    const currentHigh = data[i].high;
    const currentLow = data[i].low;
    const prevHigh = data[i-1].high; // Used for SAR adjustment on reversal
    const prevLow = data[i-1].low;   // Used for SAR adjustment on reversal


    if (isUptrend) {
      sar = prevSar + af * (ep - prevSar);
      // SAR should not be above the previous two periods' lows
      sar = Math.min(sar, data[i-1].low, (i > 1 ? data[i-2].low : data[i-1].low) );


      if (currentHigh > ep) {
        ep = currentHigh;
        af = Math.min(maxAf, af + incrementAf);
      }

      // Check for reversal
      if (sar > currentLow) { // SAR crosses below the low price - trend reverses to downtrend
        isUptrend = false;
        sar = ep; // New SAR is the highest point of the just-ended uptrend
        af = initialAf;
        ep = currentLow; // New EP is the low of the current period
      }
    } else { // Downtrend
      sar = prevSar + af * (ep - prevSar);
      // SAR should not be below the previous two periods' highs
      sar = Math.max(sar, data[i-1].high, (i > 1 ? data[i-2].high : data[i-1].high) );

      if (currentLow < ep) {
        ep = currentLow;
        af = Math.min(maxAf, af + incrementAf);
      }

      // Check for reversal
      if (sar < currentHigh) { // SAR crosses above the high price - trend reverses to uptrend
        isUptrend = true;
        sar = ep; // New SAR is the lowest point of the just-ended downtrend
        af = initialAf;
        ep = currentHigh; // New EP is the high of the current period
      }
    }
    sarValues.push({ 
      timestamp: data[i].timestamp, 
      values: { sar: sar, isBelowPrice: sar < data[i].low }
    });
  }

  return sarValues;
}

module.exports = { calculateParabolicSAR };

console.log("Parabolic SAR function defined in financial-indicators/lib/indicators/parabolic_sar.js");
