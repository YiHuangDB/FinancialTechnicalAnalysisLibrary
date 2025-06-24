/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates Williams %R.
 * Williams %R = ((Highest High(period) - Current Close) / (Highest High(period) - Lowest Low(period))) * -100
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Requires 'high', 'low', 'close'.
 * @param {number} [period=14] - The lookback period for determining Highest High and Lowest Low.
 * @returns {IndicatorOutput} Array of Williams %R values.
 *          Output starts from data[period-1].
 */
function calculateWilliamsR(data, period = 14) {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }
  if (!data || data.length < period) {
    return []; // Not enough data for the lookback period
  }

  const williamsROutput = [];

  for (let i = period - 1; i < data.length; i++) {
    const currentClose = data[i].close;
    let highestHighInPeriod = -Infinity;
    let lowestLowInPeriod = Infinity;

    // Determine Highest High and Lowest Low in the current window
    for (let j = 0; j < period; j++) {
      const currentPointInWindow = data[i - j];
      if (currentPointInWindow.high > highestHighInPeriod) {
        highestHighInPeriod = currentPointInWindow.high;
      }
      if (currentPointInWindow.low < lowestLowInPeriod) {
        lowestLowInPeriod = currentPointInWindow.low;
      }
    }

    let williamsR = 0; // Default or value for edge case
    const range = highestHighInPeriod - lowestLowInPeriod;

    if (range === 0) {
      // If range is 0 (HH = LL), this implies flat price.
      // (HH - Close) will also be 0 if Close is within that flat range.
      // %R is typically -50 in this case, or some sources say -100 if Close=High, 0 if Close=Low.
      // If HH=LL=Close, then (HH-C)=0, (HH-LL)=0. Result 0/0.
      // A common convention if range is 0 is to set %R to -50 (mid-point of its typical -100 to 0 range).
      // Or based on where the close is relative to that flat line (which it must be on).
      // If HH=LL=Close, then (HH-Close) is 0. So 0 / 0.
      // Let's use -50 as a neutral value if range is 0.
      // Or, if Close == highestHigh (and thus lowestLow), then (HH-C) is 0, so %R is 0.
      // If Close == lowestLow (and thus highestHigh), then (HH-C) is range, so (range/range)*-100 = -100.
      // This logic is better. If range is 0, HH=LL=C, so (HH-C)=0, leading to result 0.
      williamsR = 0; 
    } else {
      williamsR = ((highestHighInPeriod - currentClose) / range) * -100;
    }
    
    // Ensure values are within -100 to 0 range, though direct formula should achieve this
    // if C is within [LL, HH]. If C is outside (should not happen with HLC data), it can go beyond.
    // For safety, can clamp: williamsR = Math.max(-100, Math.min(0, williamsR));
    // However, standard formula doesn't usually clamp if data is valid.

    williamsROutput.push({
      timestamp: data[i].timestamp,
      value: williamsR,
    });
  }

  return williamsROutput;
}

module.exports = { calculateWilliamsR };

console.log("Williams %R function defined in financial-indicators/lib/indicators/williams_r.js");
