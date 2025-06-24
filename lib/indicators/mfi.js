/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

/**
 * Calculates the Money Flow Index (MFI).
 * 1. Typical Price (TP) = (High + Low + Close) / 3
 * 2. Raw Money Flow (RMF) = TP * Volume
 * 3. Positive Money Flow (PMF) & Negative Money Flow (NMF):
 *    - If TP(today) > TP(yesterday), PMF = RMF(today), NMF = 0
 *    - If TP(today) < TP(yesterday), NMF = RMF(today), PMF = 0
 *    - If TP(today) == TP(yesterday), PMF = 0, NMF = 0
 * 4. Money Flow Ratio (MFR) over N periods = Sum(PMF over N periods) / Sum(NMF over N periods)
 * 5. MFI = 100 - (100 / (1 + MFR))
 *
 * @param {OHLCVData} data - Array of OHLCV data points. Requires 'high', 'low', 'close', 'volume'.
 * @param {number} [period=14] - The period for summing PMF and NMF.
 * @returns {IndicatorOutput} Array of MFI values.
 *          Output starts after `period` money flow values are available.
 *          This means `period + 1` original data points are needed for the first MFI value.
 *          The first MFI value corresponds to `data[period]`.
 */
function calculateMFI(data, period = 14) {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error('Period must be a positive integer.');
  }
  // Need `period` money flow comparisons, which requires `period + 1` data points.
  if (data.length <= period) {
    return [];
  }

  const typicalPrices = data.map(p => ({
    timestamp: p.timestamp,
    tp: (p.high + p.low + p.close) / 3,
    volume: p.volume,
  }));

  const moneyFlows = []; // Stores { timestamp, pmf, nmf }

  // Calculate Positive and Negative Money Flows
  // Starts from index 1 because we compare with typicalPrices[i-1]
  for (let i = 1; i < typicalPrices.length; i++) {
    const rawMoneyFlow = typicalPrices[i].tp * typicalPrices[i].volume;
    let pmf = 0;
    let nmf = 0;

    if (typicalPrices[i].tp > typicalPrices[i - 1].tp) {
      pmf = rawMoneyFlow;
    } else if (typicalPrices[i].tp < typicalPrices[i - 1].tp) {
      nmf = rawMoneyFlow;
    }
    // If TPs are equal, pmf and nmf remain 0.
    
    moneyFlows.push({
      timestamp: typicalPrices[i].timestamp, // Timestamp of the current day
      pmf: pmf,
      nmf: nmf,
    });
  }
  // `moneyFlows` array has `typicalPrices.length - 1` (or `data.length - 1`) elements.
  // moneyFlows[j] corresponds to data[j+1].timestamp.

  if (moneyFlows.length < period) {
    return []; // Not enough money flow data points
  }

  const mfiValues = [];

  // Calculate MFI for each period
  // The first MFI value uses moneyFlows[0] through moneyFlows[period-1].
  // moneyFlows[period-1] corresponds to data[period].timestamp.
  for (let i = period - 1; i < moneyFlows.length; i++) {
    let sumPMF = 0;
    let sumNMF = 0;

    for (let j = 0; j < period; j++) {
      sumPMF += moneyFlows[i - j].pmf;
      sumNMF += moneyFlows[i - j].nmf;
    }

    let mfr = 0;
    if (sumNMF === 0) {
      // If sumNMF is 0, MFR is effectively infinite (if sumPMF > 0), leading to MFI = 100.
      // If both sumPMF and sumNMF are 0, MFI is often considered 50 (neutral).
      mfr = Infinity; 
    } else {
      mfr = sumPMF / sumNMF;
    }

    let mfi = 0;
    if (sumNMF === 0) {
        mfi = (sumPMF > 0) ? 100 : 50; // 100 if positive flow, 50 if no flow
    } else {
        mfi = 100 - (100 / (1 + mfr));
    }
    
    mfiValues.push({
      timestamp: moneyFlows[i].timestamp, // Timestamp from the last money flow data point in the sum window
      value: mfi,
    });
  }

  return mfiValues;
}

module.exports = { calculateMFI };

console.log("MFI function defined in financial-indicators/lib/indicators/mfi.js");
