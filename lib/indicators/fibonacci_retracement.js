/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates Fibonacci Retracement levels based on the highest high and lowest low over a given period.
 * For each point `i`, it looks at the window `data[i - period + 1]` to `data[i]`.
 *
 * Levels calculated (assuming LL to HH is an uptrend for calculation):
 * - Level 0% (effectively the Low of the period)
 * - Level 23.6%
 * - Level 38.2%
 * - Level 50.0%
 * - Level 61.8%
 * - Level 100% (effectively the High of the period)
 * (Optionally, extension levels like 161.8% can be added later)
 *
 * The function determines the absolute highest high and lowest low in the lookback window.
 * Retracement levels are then calculated based on this range.
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Requires 'high', 'low'.
 * @param {number} [period=20] - The lookback period to determine the high/low range.
 * @returns {IndicatorOutput} Array of Fibonacci level sets. Each point `i` will have:
 *          `{ timestamp, values: { level0, level236, level382, level500, level618, level100, rangeHigh, rangeLow } }`
 *          Output starts from `data[period-1]`.
 */
function calculateFibonacciRetracement(data, period = 20) {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }
  if (!data || data.length < period) {
    return []; // Not enough data for the lookback period
  }

  const fibonacciLevelsOutput = [];
  const fibRatios = [0, 0.236, 0.382, 0.500, 0.618, 1.0];
  const levelKeys = ['level0', 'level236', 'level382', 'level500', 'level618', 'level100'];

  for (let i = period - 1; i < data.length; i++) {
    let highestHighInPeriod = -Infinity;
    let lowestLowInPeriod = Infinity;

    // Determine highest high and lowest low in the current window
    for (let j = 0; j < period; j++) {
      const currentPoint = data[i - j];
      if (currentPoint.high > highestHighInPeriod) {
        highestHighInPeriod = currentPoint.high;
      }
      if (currentPoint.low < lowestLowInPeriod) {
        lowestLowInPeriod = currentPoint.low;
      }
    }

    const range = highestHighInPeriod - lowestLowInPeriod;
    const levels = {};

    if (range === 0) {
      // If range is 0, all levels are the same price.
      levelKeys.forEach(key => {
        levels[key] = lowestLowInPeriod; // or highestHighInPeriod, they are the same
      });
    } else {
      // Standard calculation: levels are measured from the start of the move.
      // For an assumed uptrend (LL to HH): Level = LL + ratio * range
      // For an assumed downtrend (HH to LL): Level = HH - ratio * range
      // The current implementation simply uses the absolute HH and LL of the window.
      // This means level0 is always lowestLowInPeriod and level100 is highestHighInPeriod.
      fibRatios.forEach((ratio, index) => {
        levels[levelKeys[index]] = lowestLowInPeriod + ratio * range;
      });
    }
    
    levels['rangeHigh'] = highestHighInPeriod;
    levels['rangeLow'] = lowestLowInPeriod;

    fibonacciLevelsOutput.push({
      timestamp: data[i].timestamp,
      values: levels,
    });
  }

  return fibonacciLevelsOutput;
}

module.exports = { calculateFibonacciRetracement };

console.log("Fibonacci Retracement function defined in financial-indicators/lib/indicators/fibonacci_retracement.js");
