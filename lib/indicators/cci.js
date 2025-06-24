/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

const { calculateSMA } = require('./ma'); // Assuming calculateSMA can work on {timestamp, value}

/**
 * Calculates the Commodity Channel Index (CCI).
 * CCI = (Typical Price - SMA(Typical Price)) / (0.015 * Mean Deviation)
 * Typical Price (TP) = (High + Low + Close) / 3
 * Mean Deviation = SMA of |TP - SMA(TP)|
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} [period=20] - The period for SMA and Mean Deviation calculation.
 * @returns {IndicatorOutput} Array of CCI values.
 *          Output starts when Mean Deviation can be calculated.
 *          First TP at data[0].
 *          First SMATP needs `period` TPs, so at data[period-1].
 *          First |TP-SMATP| diff is at data[period-1]. We need `period` such diffs for Mean Deviation.
 *          So, first Mean Dev is based on diffs from data[period-1] to data[period-1 + period-1].
 *          This means the first Mean Dev (and thus first CCI) corresponds to data[2 * period - 2].
 */
function calculateCCI(data, period = 20) {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }

  // Need `period` points for first SMATP.
  // Need `period` (TP - SMATP) differences for first Mean Deviation.
  // So, data length must be at least `period + (period - 1)` = `2 * period - 1`.
  if (data.length < (2 * period - 1)) {
    return [];
  }

  const typicalPrices = data.map(p => ({
    timestamp: p.timestamp,
    value: (p.high + p.low + p.close) / 3,
  }));

  // Calculate SMA of Typical Prices
  // calculateSMA expects {timestamp, close: value} if using 'close' source.
  const tpForSma = typicalPrices.map(tp => ({ timestamp: tp.timestamp, close: tp.value }));
  const smaTpValues = calculateSMA(tpForSma, period, 'close'); // Output has (typicalPrices.length - period + 1) points
                                                              // First SMATP corresponds to typicalPrices[period-1]

  if (smaTpValues.length === 0) return []; // Should be caught by initial length check, but good for safety

  const absoluteDeviations = []; // Array of {timestamp, value: |TP - SMATP|}
  // Align TP with SMATP. SMATP starts at typicalPrices[period-1].timestamp
  let smaTpIndex = 0;
  for (let i = period - 1; i < typicalPrices.length; i++) {
    if (smaTpIndex < smaTpValues.length && typicalPrices[i].timestamp === smaTpValues[smaTpIndex].timestamp) {
      const diff = Math.abs(typicalPrices[i].value - smaTpValues[smaTpIndex].value);
      absoluteDeviations.push({ timestamp: typicalPrices[i].timestamp, value: diff });
      smaTpIndex++;
    } else {
      // This case implies a mismatch or that typicalPrices[i] doesn't have a corresponding SMATP yet.
      // Given how SMATP is calculated, this loop structure should align them.
      // If smaTpValues is shorter than expected, it means something is off.
      // However, calculateSMA produces values for each possible window.
    }
  }
  
  // `absoluteDeviations` has same length as `smaTpValues`.
  // First element of `absoluteDeviations` corresponds to `typicalPrices[period-1]`.

  if (absoluteDeviations.length < period) {
    return []; // Not enough absolute deviations to calculate Mean Deviation
  }

  // Calculate Mean Deviation (SMA of absoluteDeviations)
  const adForSma = absoluteDeviations.map(ad => ({ timestamp: ad.timestamp, close: ad.value }));
  const meanDeviationValues = calculateSMA(adForSma, period, 'close');
  // First MeanDev corresponds to absoluteDeviations[period-1]
  // which corresponds to typicalPrices[ (period-1) + (period-1) ] = typicalPrices[2*period-2]

  const cciOutput = [];
  // Align (TP - SMATP) with Mean Deviation
  // MeanDeviationValues[k] corresponds to data point where the k-th mean deviation window ends.
  // The TP and SMATP needed are from the end of this window.
  // MeanDeviationValues[k].timestamp is absoluteDeviations[k + period - 1].timestamp
  // = typicalPrices[ (k + period - 1) + (period - 1) ].timestamp = data[k + 2*period - 2].timestamp

  let tpSmaTpDiffIndex = 0; // To iterate through (TP - SMATP) values, which are implicit in absDev
  let meanDevIndex = 0;

  // The (TP - SMATP) values are needed. We have SMATP values.
  // We need to iterate starting from where the first Mean Deviation is available.
  // First Mean Deviation is at timestamp data[2*period - 2].timestamp
  // The TP for this is typicalPrices[2*period - 2].value
  // The SMATP for this is smaTpValues aligned with typicalPrices[2*period - 2].
  // smaTpValues[0] aligns with typicalPrices[period-1].
  // So, smaTpValues[ (2*period-2) - (period-1) ] = smaTpValues[period-1] aligns with typicalPrices[2*period-2]

  for (let i = 0; i < meanDeviationValues.length; i++) {
    const currentMeanDevPoint = meanDeviationValues[i];
    const timestamp = currentMeanDevPoint.timestamp; // This is data[i + 2*period - 2].timestamp

    // Find the TP and SMATP for this timestamp
    const tpForCci = typicalPrices.find(tp => tp.timestamp === timestamp);
    const smatpForCci = smaTpValues.find(smatp => smatp.timestamp === timestamp);

    if (!tpForCci || !smatpForCci) {
        // Should not happen if all calculations align
        console.warn("CCI: Timestamp mismatch for TP/SMATP retrieval.");
        continue;
    }

    const numerator = tpForCci.value - smatpForCci.value;
    const meanDev = currentMeanDevPoint.value;
    let cci = 0;

    if (meanDev !== 0) {
      cci = numerator / (0.015 * meanDev);
    } else {
      // If Mean Deviation is 0, CCI is typically considered very high or undefined.
      // Some platforms might show 0, or a very large number, or previous value.
      // A large number if numerator is non-zero, or 0 if numerator is also zero.
      // Let's use a large number if numerator is non-zero, else 0.
      cci = (numerator !== 0) ? (numerator > 0 ? Infinity : -Infinity) : 0;
      // For practical charting, Infinity might be problematic. Consider capping or specific handling.
      // For now, let it be Infinity/ -Infinity / 0.
    }
    
    cciOutput.push({
      timestamp: timestamp,
      value: cci,
    });
  }

  return cciOutput;
}

module.exports = { calculateCCI };

console.log("CCI function defined in financial-indicators/lib/indicators/cci.js");
