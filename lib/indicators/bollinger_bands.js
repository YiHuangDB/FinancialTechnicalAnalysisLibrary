/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

const { calculateSMA } = require('./ma');

/**
 * Helper function to calculate Standard Deviation.
 * @param {number[]} values - Array of numbers.
 * @param {number} smaValue - The SMA of these values.
 * @returns {number} The standard deviation.
 */
function calculateStandardDeviation(values, smaValue) {
  if (values.length === 0) {
    return 0;
  }
  const squaredDifferencesSum = values.reduce((sum, value) => {
    return sum + Math.pow(value - smaValue, 2);
  }, 0);
  return Math.sqrt(squaredDifferencesSum / values.length);
}

/**
 * Calculates Bollinger Bands.
 * Middle Band: SMA(source, period)
 * Upper Band: Middle Band + (multiplier * StandardDeviation(source, period))
 * Lower Band: Middle Band - (multiplier * StandardDeviation(source, period))
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} [period=20] - The period for SMA and Standard Deviation.
 * @param {number} [multiplier=2] - The number of standard deviations for the upper/lower bands.
 * @param {string} [source='close'] - The source property from OHLCVData.
 * @returns {IndicatorOutput} Array of Bollinger Bands values. Each point contains a `values` object:
 *          `{ middle: number, upper: number, lower: number }`.
 *          Output starts from data[period-1].
 */
function calculateBollingerBands(data, period = 20, multiplier = 2, source = 'close') {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }
  if (multiplier < 0) {
    throw new Error('Multiplier cannot be negative.');
  }
  if (data.length < period) {
    return []; // Not enough data
  }

  const smaData = data.map(p => ({ timestamp: p.timestamp, close: p[source] }));
  const middleBandValues = calculateSMA(smaData, period, 'close'); // SMA output {timestamp, value}

  const bollingerBandsOutput = [];

  // MiddleBandValues start aligning with data[period-1]
  // For each middle band value, we need to calculate StdDev for the *same window*
  for (let i = 0; i < middleBandValues.length; i++) {
    const middleBandPoint = middleBandValues[i];
    const currentSmaValue = middleBandPoint.value;
    const currentTimestamp = middleBandPoint.timestamp;

    // The window for this SMA ended at an index in original data.
    // If middleBandValues[i] corresponds to original data[k],
    // then k = (period - 1) + i.
    const originalDataEndIndex = (period - 1) + i;
    
    const windowDataValues = [];
    for (let j = 0; j < period; j++) {
      windowDataValues.push(data[originalDataEndIndex - j][source]);
    }

    const stdDev = calculateStandardDeviation(windowDataValues, currentSmaValue);

    const upperBand = currentSmaValue + (multiplier * stdDev);
    const lowerBand = currentSmaValue - (multiplier * stdDev);

    bollingerBandsOutput.push({
      timestamp: currentTimestamp,
      values: {
        middle: currentSmaValue,
        upper: upperBand,
        lower: lowerBand,
      },
    });
  }

  return bollingerBandsOutput;
}

module.exports = { calculateBollingerBands };

console.log("Bollinger Bands function defined in financial-indicators/lib/indicators/bollinger_bands.js");
