/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

const { calculateSMA } = require('./ma'); // Assuming calculateSMA can work on generic {timestamp, value} data

/**
 * Calculates the Stochastic Oscillator (%K and %D).
 * %K = 100 * (Current Close - Lowest Low(periodK)) / (Highest High(periodK) - Lowest Low(periodK))
 * %D = SMA(%K, periodD)
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} [periodK=14] - The lookback period for calculating %K.
 * @param {number} [periodD=3] - The period for the SMA of %K to get %D.
 * @returns {IndicatorOutput} Array of Stochastic values. Each point contains a `values` object:
 *          `{ k: number, d: number }`.
 *          Output starts when %D can be calculated. This means `periodK - 1 + periodD - 1` data points
 *          are effectively "lost" from the beginning of the input data for the full %K/%D pair.
 *          The first %K is at `data[periodK - 1]`.
 *          The first %D is at `data[periodK - 1 + periodD - 1]`.
 */
function calculateStochasticOscillator(data, periodK = 14, periodD = 3) {
  if (periodK <= 0 || periodD <= 0 || !Number.isInteger(periodK) || !Number.isInteger(periodD)) {
    throw new Error('Periods for %K and %D must be positive integers.');
  }

  if (data.length < periodK) {
    return []; // Not enough data for the initial %K calculation
  }

  const kValues = []; // Array of { timestamp: number, value: number } for %K

  for (let i = periodK - 1; i < data.length; i++) {
    const currentClose = data[i].close;
    let lowestLow = Infinity;
    let highestHigh = -Infinity;

    // Find Lowest Low and Highest High for the periodK
    for (let j = 0; j < periodK; j++) {
      const periodDataPoint = data[i - j];
      if (periodDataPoint.low < lowestLow) {
        lowestLow = periodDataPoint.low;
      }
      if (periodDataPoint.high > highestHigh) {
        highestHigh = periodDataPoint.high;
      }
    }

    let kValue = 0;
    const range = highestHigh - lowestLow;
    if (range === 0) {
      // Handle division by zero: if range is 0, implies H=L=C over the period.
      // %K is often set to 100 if C=H=L, or 0, or 50, or previous value.
      // A common convention is if C is also equal to H and L, %K is undefined or treated as 50 or 100.
      // If C = H = L, then (C-L) is 0. If range is 0, C must be L and H.
      // Let's default to 50 if range is 0, as it's neutral. Some platforms use 100.
      // George Lane (creator) stated if HH=LL, %K = 100. Let's try that.
      // However, if C is also part of that flat line, (C-LL) is 0.
      // If range is 0, it means all highs and lows in periodK are the same.
      // If CurrentClose is also this value, (CurrentClose - LowestLow) is 0.
      // Then %K = 0/0 which is NaN.
      // If range is 0, use 100 if CurrentClose >= LowestLow (which it always will be if range=0 and C=L)
      // Or more simply, if range is 0, it implies no price movement, %K can be considered stable (e.g. previous %K or 50).
      // Let's use a common approach: if range is 0, %K is 100. (Often happens in very flat markets or synthetic data).
      // This is because if H=L, then C must be H and L. So C-L = 0. H-L = 0.
      // Some definitions use: if (highestHigh == lowestLow) return 100; else return (currentClose - lowestLow) / (highestHigh - lowestLow) * 100;
      // Let's set it to 100 as per some conventions for flat market.
      kValue = 100;
    } else {
      kValue = 100 * ((currentClose - lowestLow) / range);
    }
    
    kValues.push({ timestamp: data[i].timestamp, value: kValue });
  }

  if (kValues.length < periodD) {
    return []; // Not enough %K values to calculate %D
  }

  // Adapt kValues to be suitable for calculateSMA if it expects OHLCV-like structure
  // Our calculateSMA is generic enough if it uses 'value' as source.
  // Let's make a temporary array for SMA if it strictly needs 'close'.
  const kValuesForSMA = kValues.map(kv => ({ timestamp: kv.timestamp, close: kv.value }));
  const dValuesOutput = calculateSMA(kValuesForSMA, periodD, 'close'); // Use 'close' as source key

  const stochasticOutput = [];
  // Align %K and %D values. %D values start later.
  // dValuesOutput[j] corresponds to an SMA ending at kValues[j + periodD - 1]
  // So, kValue for dValuesOutput[j] is kValues[j + periodD - 1].value
  // Timestamp for dValuesOutput[j] is kValues[j + periodD - 1].timestamp

  for (let j = 0; j < dValuesOutput.length; j++) {
    const dValuePoint = dValuesOutput[j];
    const correspondingKTimestamp = dValuePoint.timestamp; // SMA output aligns with last point of its window
    
    // Find the K value that has this timestamp
    const kPoint = kValues.find(kv => kv.timestamp === correspondingKTimestamp);
    if (!kPoint) {
        // This should not happen if timestamps are consistent
        console.warn("Timestamp mismatch between K and D values in Stochastic calculation.");
        continue;
    }

    stochasticOutput.push({
      timestamp: correspondingKTimestamp,
      values: {
        k: kPoint.value,
        d: dValuePoint.value,
      },
    });
  }

  return stochasticOutput;
}

module.exports = { calculateStochasticOscillator };

console.log("Stochastic Oscillator function defined in financial-indicators/lib/indicators/stochastic.js");
