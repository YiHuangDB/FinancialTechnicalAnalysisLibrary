/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

// Using emaLikeSmoothing from utils.js.
const { emaLikeSmoothing } = require('../utils');

/**
 * Calculates the Relative Strength Index (RSI).
 * RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss
 * Average Gain/Loss are typically calculated using a specific smoothing method similar to EMA.
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} [period=14] - The period for calculating average gains/losses.
 * @param {string} [source='close'] - The source property from OHLCVData (e.g., 'close').
 * @returns {IndicatorOutput} Array of RSI values.
 */
function calculateRSI(data, period = 14, source = 'close') {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }
  if (data.length <= period) { 
    return [];
  }

  const gains = [];
  const losses = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i][source] - data[i - 1][source];
    if (change > 0) {
      gains.push({ timestamp: data[i].timestamp, value: change });
      losses.push({ timestamp: data[i].timestamp, value: 0 });
    } else {
      gains.push({ timestamp: data[i].timestamp, value: 0 });
      losses.push({ timestamp: data[i].timestamp, value: Math.abs(change) });
    }
  }

  if (gains.length < period) { 
      return [];
  }
  
  const avgGainValues = emaLikeSmoothing(gains.map(g => g.value), period);
  const avgLossValues = emaLikeSmoothing(losses.map(l => l.value), period);

  const rsiValues = [];
  const numRSIPoints = avgGainValues.length;

  for (let i = 0; i < numRSIPoints; i++) {
    const avgGain = avgGainValues[i];
    const avgLoss = avgLossValues[i];
    
    let rs = 0;
    if (avgLoss === 0) {
      rs = Infinity; 
    } else {
      rs = avgGain / avgLoss;
    }

    const rsi = 100 - (100 / (1 + rs));
    
    // Timestamp alignment: First RSI corresponds to data[period].
    // avgGainValues[i] corresponds to an average ending at gains[i + period - 1].
    // gains[i + period - 1].timestamp corresponds to data[i + period].timestamp.
    rsiValues.push({
      timestamp: data[i + period].timestamp, 
      value: (avgLoss === 0 && avgGain > 0) ? 100 : ((avgLoss === 0 && avgGain === 0) ? 50 : rsi)
    });
  }

  return rsiValues;
}

module.exports = { calculateRSI };

console.log("RSI function defined in financial-indicators/lib/indicators/rsi.js");
