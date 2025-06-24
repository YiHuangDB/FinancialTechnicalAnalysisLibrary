/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

const { wildersSmoothing } = require('../utils');

/**
 * Calculates the Average True Range (ATR).
 * 1. Calculate True Range (TR) for each period.
 *    TR = max(High - Low, |High - Previous Close|, |Low - Previous Close|)
 * 2. ATR = Wilder's smoothing of TR over a specified period.
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Must have at least 2 points for first TR.
 * @param {number} [period=14] - The period for smoothing the True Range.
 * @returns {IndicatorOutput} Array of ATR values.
 *          Output starts when the first ATR value can be calculated, which is after `period` TR values
 *          have been computed. This means `period` days of TR values (requiring `period+1` original data points).
 *          So, the first ATR value corresponds to `data[period]`.
 */
function calculateATR(data, period = 14) {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }
  // Need at least 2 data points for the first TR value.
  // Need `period` TR values for the first ATR (SMA part of Wilder's).
  // So, need `period + 1` data points in total.
  if (data.length <= period) { 
    return [];
  }

  const trValuesWithTimestamp = []; // Store {timestamp, value: tr}

  // Calculate True Range values
  // First TR value uses data[0] and data[1], corresponds to data[1].timestamp
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];

    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    trValuesWithTimestamp.push({
        timestamp: current.timestamp,
        value: Math.max(tr1, tr2, tr3)
    });
  }
  // trValuesWithTimestamp has (data.length - 1) elements.
  // Timestamps align with data[1] through data[data.length-1].

  if (trValuesWithTimestamp.length < period) {
    return []; // Not enough TR values for smoothing
  }
  
  const trNumericValues = trValuesWithTimestamp.map(tr => tr.value);
  const atrSmoothedValues = wildersSmoothing(trNumericValues, period);

  const atrOutput = [];
  // atrSmoothedValues has (trNumericValues.length - period + 1) elements.
  // The first element corresponds to the `period`-th element of `trNumericValues`.
  // trNumericValues[period-1] corresponds to trValuesWithTimestamp[period-1].
  // trValuesWithTimestamp[period-1] has timestamp data[period].timestamp.
  // So, the first ATR output corresponds to data[period].timestamp.

  for (let i = 0; i < atrSmoothedValues.length; i++) {
    // The i-th smoothed ATR value corresponds to the TR value at index (i + period - 1) in trValuesWithTimestamp
    const timestampIndexInTr = i + period - 1;
    atrOutput.push({
      timestamp: trValuesWithTimestamp[timestampIndexInTr].timestamp,
      value: atrSmoothedValues[i],
    });
  }

  return atrOutput;
}

module.exports = { calculateATR };

console.log("ATR function defined in financial-indicators/lib/indicators/atr.js");
