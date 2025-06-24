/**
 * @module utils
 * @description Shared utility functions for technical indicators.
 */

/**
 * Wilder's Smoothing (also known as Smoothed Moving Average - SMMA, or Running Moving Average - RMA).
 * The first value is a Simple Moving Average (SMA).
 * Subsequent values are calculated as: NewValue = (PreviousValue * (Period - 1) + CurrentData) / Period
 * OR equivalently: NewValue = PreviousValue - PreviousValue/Period + CurrentData (if CurrentData is not divided by Period)
 * The implementation used here: CurrentSmoothed = (PreviousSmoothed * (Period - 1) + CurrentDataPoint) / Period
 *
 * @param {number[]} dataArray - Array of numbers to smooth.
 * @param {number} period - The smoothing period.
 * @returns {number[]} Array of smoothed values. Returns empty if not enough data.
 */
function wildersSmoothing(dataArray, period) {
    if (!dataArray || dataArray.length < period || period <= 0) {
        return [];
    }
    const smoothedValues = [];
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += dataArray[i];
    }
    smoothedValues.push(sum / period); // First value is an SMA

    for (let i = period; i < dataArray.length; i++) {
        const prevSmoothed = smoothedValues[smoothedValues.length - 1];
        const currentSmoothed = (prevSmoothed * (period - 1) + dataArray[i]) / period;
        smoothedValues.push(currentSmoothed);
    }
    return smoothedValues;
}


/**
 * Calculates (Highest High + Lowest Low) / 2 over a period for OHLCV data.
 * @param {import('./data_models').OHLCVDataPoint[]} periodData - Array of OHLCV data points for the period.
 * @returns {number|null} The calculated mid value, or null if data is empty or invalid.
 */
function calculateHighLowMid(periodData) {
  if (!periodData || periodData.length === 0) {
    return null;
  }
  let highestHigh = -Infinity;
  let lowestLow = Infinity;
  for (const p of periodData) {
    if (p && typeof p.high === 'number' && p.high > highestHigh) highestHigh = p.high;
    if (p && typeof p.low === 'number' && p.low < lowestLow) lowestLow = p.low;
  }
  
  if (highestHigh === -Infinity || lowestLow === Infinity) { // No valid high/low found
      return null;
  }
  return (highestHigh + lowestLow) / 2;
}


/**
 * Calculates a smoothed moving average using an EMA-like formula structure.
 * First value is SMA. Subsequent values: NewAvg = PrevAvg * (Period-1)/Period + NewValue.
 * This is used by RSI for its average gains/losses.
 *
 * @param {number[]} dataArray - Array of numbers to smooth.
 * @param {number} period - The smoothing period.
 * @returns {number[]} Array of smoothed values. Returns empty if not enough data.
 */
function emaLikeSmoothing(dataArray, period) {
    if (!dataArray || dataArray.length < period || period <= 0) {
        return [];
    }
    const smoothedValues = [];
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += dataArray[i];
    }
    smoothedValues.push(sum / period); // First value is an SMA

    for (let i = period; i < dataArray.length; i++) {
        const prevSmoothed = smoothedValues[smoothedValues.length - 1];
        const currentSmoothed = prevSmoothed * (period - 1) / period + dataArray[i];
        smoothedValues.push(currentSmoothed);
    }
    return smoothedValues;
}


module.exports = {
    wildersSmoothing,
    emaLikeSmoothing,
    calculateHighLowMid,
};

console.log("Utility functions defined in financial-indicators/lib/utils.js");
