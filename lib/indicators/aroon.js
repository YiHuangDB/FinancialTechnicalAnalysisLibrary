/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates the Aroon Indicator (Aroon Up, Aroon Down, and Aroon Oscillator).
 * Aroon Up = ((Period - Periods Since Highest High) / Period) * 100
 * Aroon Down = ((Period - Periods Since Lowest Low) / Period) * 100
 * Aroon Oscillator = Aroon Up - Aroon Down
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Requires 'high', 'low'.
 * @param {number} [period=25] - The lookback period.
 * @returns {IndicatorOutput} Array of Aroon values. Each point contains a `values` object:
 *          `{ up: number, down: number, oscillator: number }`.
 *          Output starts from data[period-1] because the calculation requires a full period window.
 *          Note: Some definitions start Aroon from data[period] because "periods since" for the first
 *          possible calculation (at data[period-1]) would refer to highs/lows within data[0]...data[period-1].
 *          If highest high is at data[period-1], periods since HH is 0.
 *          If highest high is at data[0], periods since HH is period-1.
 *          The calculation here aligns with common platforms where the first value appears after one full period.
 */
function calculateAroon(data, period = 25) {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }
  if (!data || data.length < period) {
    return []; // Not enough data for the lookback period
  }

  const aroonOutput = [];

  for (let i = period - 1; i < data.length; i++) {
    let highestHighInPeriod = -Infinity;
    let periodsSinceHH = 0;
    let lowestLowInPeriod = Infinity;
    let periodsSinceLL = 0;

    // Determine Highest High, Lowest Low, and periods since they occurred in the current window
    // The window is data[i - period + 1] through data[i]
    for (let j = 0; j < period; j++) {
      const currentPointInWindow = data[i - j]; // Iterating backwards through the window
      
      if (currentPointInWindow.high >= highestHighInPeriod) { // Use >= to get the most recent high if multiple same highs
        highestHighInPeriod = currentPointInWindow.high;
        periodsSinceHH = j; // j is periods ago from current `i`
      }
      if (currentPointInWindow.low <= lowestLowInPeriod) { // Use <= for most recent low
        lowestLowInPeriod = currentPointInWindow.low;
        periodsSinceLL = j;
      }
    }

    const aroonUp = ((period - periodsSinceHH) / period) * 100;
    const aroonDown = ((period - periodsSinceLL) / period) * 100;
    const aroonOscillator = aroonUp - aroonDown;
    
    aroonOutput.push({
      timestamp: data[i].timestamp,
      values: {
        up: aroonUp,
        down: aroonDown,
        oscillator: aroonOscillator,
      },
    });
  }

  return aroonOutput;
}

module.exports = { calculateAroon };

console.log("Aroon Indicator function defined in financial-indicators/lib/indicators/aroon.js");
