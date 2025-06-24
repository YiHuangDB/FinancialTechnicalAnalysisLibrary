/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').OHLCVDataPoint} OHLCVDataPoint
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

const { calculateHighLowMid } = require('../utils');

/**
 * Calculates the Ichimoku Kinko Hyo (Ichimoku Cloud).
 * Components:
 * 1. Tenkan-sen (Conversion Line): (Highest High + Lowest Low) / 2 for past `tenkanPeriod` periods.
 * 2. Kijun-sen (Base Line): (Highest High + Lowest Low) / 2 for past `kijunPeriod` periods.
 * 3. Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2, plotted `displacement` periods ahead.
 * 4. Senkou Span B (Leading Span B): (Highest High + Lowest Low) / 2 for past `senkouBPeriod` periods, plotted `displacement` periods ahead.
 * 5. Chikou Span (Lagging Span): Current closing price, plotted `displacement` periods behind.
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} [tenkanPeriod=9] - Period for Tenkan-sen.
 * @param {number} [kijunPeriod=26] - Period for Kijun-sen.
 * @param {number} [senkouBPeriod=52] - Period for Senkou Span B.
 * @param {number} [displacement=26] - Displacement for Senkou Spans (ahead) and Chikou Span (behind).
 * @returns {IndicatorOutput} Array of Ichimoku values.
 *          Each point contains: { timestamp, values: { tenkan, kijun, senkouA, senkouB, chikou } }
 *          Note: senkouA, senkouB, and chikou might be null if their displaced values fall out of the main data range.
 *          The output array is aligned with the main data's timestamps.
 */
function calculateIchimokuCloud(
  data,
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouBPeriod = 52,
  displacement = 26
) {
  if (
    tenkanPeriod <= 0 || kijunPeriod <= 0 || senkouBPeriod <= 0 || displacement < 0 ||
    !Number.isInteger(tenkanPeriod) || !Number.isInteger(kijunPeriod) ||
    !Number.isInteger(senkouBPeriod) || !Number.isInteger(displacement)
  ) {
    throw new Error('All periods and displacement must be positive integers (displacement can be 0).');
  }

  const results = [];
  const len = data.length;

  if (len === 0) return [];

  // Pre-calculate all Tenkan-sen, Kijun-sen, and Senkou Span B base values
  const tenkanValues = new Array(len).fill(null);
  const kijunValues = new Array(len).fill(null);
  const senkouBSrcValues = new Array(len).fill(null); // Values before displacement

  for (let i = 0; i < len; i++) {
    if (i >= tenkanPeriod - 1) {
      tenkanValues[i] = calculateHighLowMid(data.slice(i - tenkanPeriod + 1, i + 1));
    }
    if (i >= kijunPeriod - 1) {
      kijunValues[i] = calculateHighLowMid(data.slice(i - kijunPeriod + 1, i + 1));
    }
    if (i >= senkouBPeriod - 1) {
      senkouBSrcValues[i] = calculateHighLowMid(data.slice(i - senkouBPeriod + 1, i + 1));
    }
  }
  
  // Prepare the final output structure, aligning with original data timestamps
  for (let i = 0; i < len; i++) {
    const currentTimestamp = data[i].timestamp;
    const tenkan = tenkanValues[i];
    const kijun = kijunValues[i];
    
    let senkouA = null;
    if (tenkan !== null && kijun !== null) {
        // Senkou A is calculated from current Tenkan/Kijun but plotted `displacement` periods in the future.
        // So, the Senkou A value for `data[i]` actually comes from `displacement` periods ago.
        // The Senkou A we calculate AT `data[i]` will be plotted at `data[i + displacement]`.
        // For the purpose of outputting at `data[i]`, we need to look back.
        const senkouA_SrcIndex = i - displacement;
        if (senkouA_SrcIndex >= 0 && 
            tenkanValues[senkouA_SrcIndex] !== null && 
            kijunValues[senkouA_SrcIndex] !== null) {
            senkouA = (tenkanValues[senkouA_SrcIndex] + kijunValues[senkouA_SrcIndex]) / 2;
        }
    }

    let senkouB = null;
    // Senkou B is calculated from `senkouBPeriod` data, then plotted `displacement` periods in the future.
    // Similar to Senkou A, for the value at `data[i]`, we look back.
    const senkouB_SrcIndex = i - displacement;
    if (senkouB_SrcIndex >= 0 && senkouBSrcValues[senkouB_SrcIndex] !== null) {
        senkouB = senkouBSrcValues[senkouB_SrcIndex];
    }

    let chikou = null;
    // Chikou Span is current close plotted `displacement` periods in the past.
    // So, the Chikou value for `data[i]` is the close from `data[i + displacement]`.
    const chikou_SrcIndex = i + displacement;
    if (chikou_SrcIndex < len) {
      chikou = data[chikou_SrcIndex].close;
    }

    // Only add point if at least Tenkan or Kijun is available (or any other primary component)
    // Kijun period is usually the longest non-displaced, so use that as a baseline
    if (i >= kijunPeriod -1 || i >= tenkanPeriod -1 ) { // Ensure we have at least some core values
        results.push({
            timestamp: currentTimestamp,
            values: {
                tenkan: tenkan,
                kijun: kijun,
                senkouA: senkouA,
                senkouB: senkouB,
                chikou: chikou,
            },
        });
    } else if (chikou !== null || senkouA !== null || senkouB !== null) {
        // Case where only displaced values might appear early due to look-ahead/look-back
        // Example: Chikou span for data[0] is close of data[displacement].
        // Ensure a consistent output length, even if primary values are null.
        // The main loop structure from 0 to len handles this.
        // We will output for all timestamps, some values might be null.
         results.push({
            timestamp: currentTimestamp,
            values: { // tenkan, kijun will be null here
                tenkan: null, 
                kijun: null,
                senkouA: senkouA,
                senkouB: senkouB,
                chikou: chikou,
            },
        });
    }
  }
  
  // The above logic for pushing might create initial entries where tenkan/kijun are null.
  // A common approach for Ichimoku output is to start when Kijun-sen is available,
  // as it's typically the longest of the "present" calculations.
  // And then Senkou A/B are projected from that point forward, Chikou projected backward.

  // Let's refine the output loop to be simpler:
  // Create an array of objects for each data point, then populate.
  // Displaced values will naturally be null if their source is out of bounds.

  const finalOutput = [];
  for (let i = 0; i < len; i++) {
    const currentDataPoint = data[i];
    
    // Tenkan-sen and Kijun-sen (calculated at current point i)
    const currentTenkan = (i >= tenkanPeriod - 1) ? calculateHighLowMid(data.slice(i - tenkanPeriod + 1, i + 1)) : null;
    const currentKijun = (i >= kijunPeriod - 1) ? calculateHighLowMid(data.slice(i - kijunPeriod + 1, i + 1)) : null;

    // Senkou Span A for current point i (value is from i - displacement)
    let displacedSenkouA = null;
    const senkouASrcIdx = i - displacement;
    if (senkouASrcIdx >= 0) {
      const tenkanAtSrc = (senkouASrcIdx >= tenkanPeriod - 1) ? calculateHighLowMid(data.slice(senkouASrcIdx - tenkanPeriod + 1, senkouASrcIdx + 1)) : null;
      const kijunAtSrc = (senkouASrcIdx >= kijunPeriod - 1) ? calculateHighLowMid(data.slice(senkouASrcIdx - kijunPeriod + 1, senkouASrcIdx + 1)) : null;
      if (tenkanAtSrc !== null && kijunAtSrc !== null) {
        displacedSenkouA = (tenkanAtSrc + kijunAtSrc) / 2;
      }
    }

    // Senkou Span B for current point i (value is from i - displacement)
    let displacedSenkouB = null;
    const senkouBSrcIdx = i - displacement;
    if (senkouBSrcIdx >= 0 && senkouBSrcIdx >= senkouBPeriod - 1) {
      displacedSenkouB = calculateHighLowMid(data.slice(senkouBSrcIdx - senkouBPeriod + 1, senkouBSrcIdx + 1));
    }
    
    // Chikou Span for current point i (value is from i + displacement)
    const chikouSrcIdx = i + displacement;
    const displacedChikou = (chikouSrcIdx < len) ? data[chikouSrcIdx].close : null;
    
    // We output a point for every input data point to maintain alignment for charting.
    // Some values will be null if they cannot be calculated.
    finalOutput.push({
      timestamp: currentDataPoint.timestamp,
      values: {
        tenkan: currentTenkan,
        kijun: currentKijun,
        senkouA: displacedSenkouA,
        senkouB: displacedSenkouB,
        chikou: displacedChikou,
      },
    });
  }

  return finalOutput;
}

module.exports = { calculateIchimokuCloud };

console.log("Ichimoku Cloud function defined in financial-indicators/lib/indicators/ichimoku.js");
