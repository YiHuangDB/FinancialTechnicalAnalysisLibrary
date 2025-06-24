/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates the Simple Moving Average (SMA).
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} period - The period over which to calculate the SMA.
 * @param {string} [source='close'] - The source property to use from OHLCVData (e.g., 'open', 'high', 'low', 'close').
 * @returns {IndicatorOutput} Array of SMA values.
 */
function calculateSMA(data, period, source = 'close') {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }
  if (data.length < period) {
    return []; // Not enough data to calculate SMA for the given period
  }

  const smaValues = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j][source];
    }
    smaValues.push({
      timestamp: data[i].timestamp,
      value: sum / period,
    });
  }
  return smaValues;
}

/**
 * Calculates the Exponential Moving Average (EMA).
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} period - The period over which to calculate the EMA.
 * @param {string} [source='close'] - The source property to use from OHLCVData.
 * @returns {IndicatorOutput} Array of EMA values.
 */
function calculateEMA(data, period, source = 'close') {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }
  if (data.length < period) {
    return []; // Not enough data
  }

  const emaValues = [];
  const multiplier = 2 / (period + 1);
  let sumForFirstSma = 0;

  // Calculate the first EMA value using an SMA
  for (let i = 0; i < period; i++) {
    sumForFirstSma += data[i][source];
  }
  let previousEma = sumForFirstSma / period;
  emaValues.push({
    timestamp: data[period - 1].timestamp,
    value: previousEma,
  });

  // Calculate subsequent EMA values
  for (let i = period; i < data.length; i++) {
    const currentPrice = data[i][source];
    const ema = (currentPrice - previousEma) * multiplier + previousEma;
    emaValues.push({
      timestamp: data[i].timestamp,
      value: ema,
    });
    previousEma = ema;
  }
  return emaValues;
}

/**
 * Calculates the Weighted Moving Average (WMA).
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} period - The period over which to calculate the WMA.
 * @param {string} [source='close'] - The source property to use from OHLCVData.
 * @returns {IndicatorOutput} Array of WMA values.
 */
function calculateWMA(data, period, source = 'close') {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }
  if (data.length < period) {
    return []; // Not enough data
  }

  const wmaValues = [];
  const divisor = (period * (period + 1)) / 2; // Sum of weights (1 + 2 + ... + period)

  for (let i = period - 1; i < data.length; i++) {
    let weightedSum = 0;
    for (let j = 0; j < period; j++) {
      // Current data point gets weight 'period', oldest gets weight '1'
      weightedSum += data[i - j][source] * (period - j);
    }
    wmaValues.push({
      timestamp: data[i].timestamp,
      value: weightedSum / divisor,
    });
  }
  return wmaValues;
}

module.exports = {
  calculateSMA,
  calculateEMA,
  calculateWMA,
};

console.log("Moving Average functions (SMA, EMA, WMA) defined in financial-indicators/lib/indicators/ma.js");
