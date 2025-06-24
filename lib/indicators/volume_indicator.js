/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

const { calculateSMA } = require('./ma');

/**
 * Calculates Volume data, optionally as a Simple Moving Average (SMA) of volume.
 * If no period is provided, it returns the raw volume.
 * If a period is provided, it returns the SMA of the volume.
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Requires 'volume'.
 * @param {number} [period] - Optional. The period for calculating SMA of volume.
 * @returns {IndicatorOutput} Array of volume values.
 *          If period is given, output starts from data[period-1].
 *          Otherwise, output has same length as input data.
 */
function calculateVolumeIndicator(data, period) {
  if (!data) {
    return [];
  }

  if (period !== undefined) {
    if (typeof period !== 'number' || period <= 0 || !Number.isInteger(period)) {
      throw new Error('If period is provided, it must be a positive integer.');
    }
    if (data.length < period) {
      return []; // Not enough data for SMA
    }
    // Prepare data for SMA function (expects {timestamp, close: value_to_average})
    const volumeDataForSMA = data.map(p => ({
      timestamp: p.timestamp,
      close: p.volume, // Use 'close' key as that's what calculateSMA expects for its 'source'
    }));
    return calculateSMA(volumeDataForSMA, period, 'close'); // SMA result is {timestamp, value}
  } else {
    // Return raw volume
    return data.map(p => ({
      timestamp: p.timestamp,
      value: p.volume,
    }));
  }
}

module.exports = { calculateVolumeIndicator };

console.log("Volume Indicator function defined in financial-indicators/lib/indicators/volume_indicator.js");
