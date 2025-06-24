/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

const { calculateEMA } = require('./ma');

/**
 * Calculates TRIX (Triple Exponentially Smoothed Moving Average).
 * 1. EMA1 = EMA(source, period)
 * 2. EMA2 = EMA(EMA1, period)
 * 3. EMA3 = EMA(EMA2, period)
 * 4. TRIX = 1-period % Rate-of-Change of EMA3: ((EMA3_today - EMA3_yesterday) / abs(EMA3_yesterday)) * 100
 *    Using abs(EMA3_yesterday) in denominator to handle potential negative EMA values if source can be negative,
 *    though for price data EMAs are usually positive. If EMA3_yesterday is 0, TRIX is 0 or handled.
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} [period=15] - The period for each EMA calculation.
 * @param {string} [source='close'] - The source property from OHLCVData.
 * @returns {IndicatorOutput} Array of TRIX values.
 *          Output starts when the first TRIX value (which needs two consecutive EMA3 values) can be calculated.
 *          Each EMA needs `period-1` initial points removed. Three EMAs mean `3 * (period-1)` points lost for EMA3.
 *          Then one more point for the RoC. So, `3 * (period-1) + 1` points lost from the start.
 *          First TRIX value corresponds to `data[3 * (period - 1) + 1]`.
 */
function calculateTRIX(data, period = 15, source = 'close') {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }

  // Each EMA effectively "loses" (period - 1) data points from the start of its input.
  // EMA1 input: data. Output length: data.length - (period - 1)
  // EMA2 input: EMA1 output. Output length: EMA1.length - (period - 1)
  // EMA3 input: EMA2 output. Output length: EMA2.length - (period - 1)
  // Total "lost" for EMA3: 3 * (period - 1)
  // TRIX needs two EMA3 values, so EMA3 output must have length at least 2.
  // EMA3.length >= 2  =>  (data.length - 3 * (period - 1)) >= 2
  // data.length >= 3 * period - 3 + 2  => data.length >= 3 * period - 1
  if (data.length < (3 * period - 1)) {
    return [];
  }

  // EMA1
  const ema1Output = calculateEMA(data, period, source);
  if (ema1Output.length < period) return []; // Not enough for EMA2

  // EMA2 - input needs to be in {timestamp, close: value} format for calculateEMA
  const ema1ForEma2 = ema1Output.map(p => ({ timestamp: p.timestamp, close: p.value }));
  const ema2Output = calculateEMA(ema1ForEma2, period, 'close');
  if (ema2Output.length < period) return []; // Not enough for EMA3

  // EMA3
  const ema2ForEma3 = ema2Output.map(p => ({ timestamp: p.timestamp, close: p.value }));
  const ema3Output = calculateEMA(ema2ForEma3, period, 'close'); // Array of {timestamp, value}

  if (ema3Output.length < 2) {
    return []; // Not enough EMA3 values to calculate RoC
  }

  const trixValues = [];
  for (let i = 1; i < ema3Output.length; i++) {
    const ema3Today = ema3Output[i].value;
    const ema3Yesterday = ema3Output[i - 1].value;
    let trix = 0;

    if (ema3Yesterday !== 0) {
      // Using abs for denominator to avoid issues if EMAs could somehow be negative,
      // though this is unlikely for price data. A common practice.
      trix = ((ema3Today - ema3Yesterday) / Math.abs(ema3Yesterday)) * 100;
    } else {
      // If ema3Yesterday is 0:
      // if ema3Today is also 0, trix is 0.
      // if ema3Today is non-zero, change is infinite. Can return large number or Infinity.
      trix = (ema3Today === 0) ? 0 : (ema3Today > 0 ? Infinity : -Infinity);
    }
    
    trixValues.push({
      timestamp: ema3Output[i].timestamp, // TRIX aligns with the 'today' EMA3 value
      value: trix,
    });
  }

  return trixValues;
}

module.exports = { calculateTRIX };

console.log("TRIX function defined in financial-indicators/lib/indicators/trix.js");
