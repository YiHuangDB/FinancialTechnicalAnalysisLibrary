/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 * @typedef {import('./ma').calculateEMA} calculateEMA
 */

const { calculateEMA } = require('./ma');

/**
 * Calculates the Moving Average Convergence Divergence (MACD).
 *
 * MACD Line: (12-period EMA - 26-period EMA)
 * Signal Line: 9-period EMA of MACD Line
 * MACD Histogram: MACD Line - Signal Line
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} [shortPeriod=12] - The period for the shorter EMA.
 * @param {number} [longPeriod=26] - The period for the longer EMA.
 * @param {number} [signalPeriod=9] - The period for the EMA of the MACD line (signal line).
 * @param {string} [source='close'] - The source property to use from OHLCVData.
 * @returns {IndicatorOutput} Array of MACD values (macd, signal, histogram).
 *                            Each point will have a `values` object: { macd: number, signal: number, histogram: number }
 */
function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9, source = 'close') {
  if (shortPeriod <= 0 || longPeriod <= 0 || signalPeriod <= 0 ||
      !Number.isInteger(shortPeriod) || !Number.isInteger(longPeriod) || !Number.isInteger(signalPeriod)) {
    throw new Error('All periods (short, long, signal) must be positive integers.');
  }
  if (shortPeriod >= longPeriod) {
    throw new Error('Short period must be less than long period for MACD calculation.');
  }

  const emaShort = calculateEMA(data, shortPeriod, source);
  const emaLong = calculateEMA(data, longPeriod, source);

  if (emaLong.length === 0) { // Not enough data for the longest EMA
    return [];
  }

  const macdLine = [];
  // Align MACD line calculation with the end of the longer EMA period
  // emaShort will have (longPeriod - shortPeriod) more leading values than emaLong.
  // We need to find the corresponding emaShort value for each emaLong value.

  let j = 0; // Pointer for emaLong
  for (let i = 0; i < emaShort.length && j < emaLong.length; i++) {
    if (emaShort[i].timestamp === emaLong[j].timestamp) {
      macdLine.push({
        timestamp: emaLong[j].timestamp,
        value: emaShort[i].value - emaLong[j].value, // MACD value
      });
      j++;
    } else if (emaShort[i].timestamp < emaLong[j].timestamp) {
      // This emaShort value is before the current emaLong value, skip it
      continue;
    } else {
      // This should ideally not happen if data is dense enough and timestamps align
      // Or it means emaLong has a timestamp not in emaShort, which is an issue
      // For safety, advance j if emaLong[j] is too old.
      // This situation implies data gaps or issues with EMA output alignment.
      // However, calculateEMA aligns output timestamps with input data.
      // So, the primary concern is matching the starting points.
      // The first value of emaLong corresponds to data[longPeriod-1].timestamp
      // The value of emaShort that matches this is at index (longPeriod-1) - (shortPeriod-1)
      // = longPeriod - shortPeriod in the emaShort array, assuming no gaps in original data.
      // The loop above handles sparse data better.
      j++;
      i--; // Re-evaluate current emaShort[i] against next emaLong[j]
    }
  }
  
  if (macdLine.length < signalPeriod) {
    // Not enough MACD line values to calculate signal line
    return [];
  }

  // The macdLine is now an array of {timestamp, value} objects, treat 'value' as the source for next EMA.
  // We need to adapt it to the OHLCVData format expected by calculateEMA or modify calculateEMA.
  // For now, let's create a temporary data structure for calculateEMA:
  const macdLineForSignalCalc = macdLine.map(p => ({ timestamp: p.timestamp, close: p.value }));
  const signalLine = calculateEMA(macdLineForSignalCalc, signalPeriod, 'close');


  const macdOutput = [];
  let k = 0; // Pointer for signalLine
  for (let i = 0; i < macdLine.length && k < signalLine.length; i++) {
    // Find matching signal line point for current MACD line point
    if (macdLine[i].timestamp === signalLine[k].timestamp) {
      const macdValue = macdLine[i].value;
      const signalValue = signalLine[k].value;
      macdOutput.push({
        timestamp: macdLine[i].timestamp,
        values: {
          macd: macdValue,
          signal: signalValue,
          histogram: macdValue - signalValue,
        },
      });
      k++;
    } else if (macdLine[i].timestamp < signalLine[k].timestamp) {
      // This macdLine point is before the current signalLine point starts.
      // This implies it doesn't have a corresponding signal value yet.
      // We only output when all three (MACD, Signal, Histogram) can be computed.
      continue;
    } else {
        // signalLine[k] is older, advance k. This shouldn't happen if signalLine is derived from macdLine.
        k++;
        i--; // re-evaluate current macdLine point
    }
  }

  return macdOutput;
}

module.exports = { calculateMACD };

console.log("MACD function defined in financial-indicators/lib/indicators/macd.js");
