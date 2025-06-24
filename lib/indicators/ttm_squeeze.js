/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

const { calculateSMA, calculateEMA } = require('./ma');
const { calculateBollingerBands } = require('./bollinger_bands');
const { calculateATR } = require('./atr');

/**
 * Calculates the TTM Squeeze indicator.
 * Identifies periods of low volatility (squeeze) by comparing Bollinger Bands and Keltner Channels.
 *
 * Components:
 * 1. Bollinger Bands (BB): SMA(close, bPeriod) +/- (bMultiplier * StdDev(close, bPeriod))
 * 2. Keltner Channels (KC):
 *    - Middle Line: EMA(TypicalPrice, kPeriod)
 *    - Upper/Lower: Middle Line +/- (ATR(atrPeriod) * kMultiplier)
 *    (Typical Price = (High + Low + Close) / 3)
 * 3. Squeeze On: BB_Upper < KC_Upper AND BB_Lower > KC_Lower
 * 4. Output Value (Momentum): Close - SMA(Close, momentumPeriod, source)
 *
 * Note: Commonly, bPeriod, kPeriod, atrPeriod, and momentumPeriod are the same (e.g., 20).
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {object} [options] - Configuration options.
 * @param {number} [options.bPeriod=20] - Period for Bollinger Bands SMA and StdDev.
 * @param {number} [options.bMultiplier=2.0] - Multiplier for Bollinger Bands StdDev.
 * @param {number} [options.kPeriod=20] - Period for Keltner Channels EMA and ATR. (Often same as bPeriod)
 * @param {number} [options.kMultiplier=1.5] - Multiplier for Keltner Channels ATR.
 * @param {string} [options.source='close'] - Source for BBands and momentum value calculation.
 * @returns {IndicatorOutput} Array of TTM Squeeze values. Each point has:
 *          `{ timestamp, values: { isSqueezeOn: boolean, momentum: number, bUpper, bLower, kUpper, kLower } }`
 *          Output starts when all underlying indicators can produce a value.
 */
function calculateTTMSqueeze(data, options = {}) {
  const {
    bPeriod = 20,
    bMultiplier = 2.0,
    kPeriod = 20, // Often same as bPeriod
    kMultiplier = 1.5,
    source = 'close', // Source for BBands and the momentum value
  } = options;

  if (bPeriod <= 0 || kPeriod <= 0 || !Number.isInteger(bPeriod) || !Number.isInteger(kPeriod) ||
      bMultiplier < 0 || kMultiplier < 0) {
    throw new Error('Periods must be positive integers and multipliers non-negative.');
  }

  // Minimum length for BBands is bPeriod.
  // Minimum length for Keltner (EMA + ATR) is kPeriod (EMA needs kPeriod, ATR needs kPeriod+1 for its first value, which aligns with data[kPeriod]).
  // The overall minimum length will be dictated by the component that needs the most data.
  // ATR(kPeriod) output starts at data[kPeriod]. EMA(kPeriod) output starts at data[kPeriod-1].
  // So Keltner Channels will start producing values around data[kPeriod].
  // Bollinger Bands start at data[bPeriod-1].
  // The momentum SMA also needs `bPeriod` data points.
  const minLength = Math.max(bPeriod, kPeriod +1); // kPeriod for EMA_TP, +1 because ATR needs kPeriod TR values.
  if (!data || data.length < minLength) {
    return [];
  }

  // 1. Bollinger Bands
  const bbOutput = calculateBollingerBands(data, bPeriod, bMultiplier, source);

  // 2. Keltner Channels
  // 2a. Typical Price
  const typicalPrices = data.map(p => ({
    timestamp: p.timestamp,
    value: (p.high + p.low + p.close) / 3,
    // Keep original data for ATR calculation
    high: p.high, low: p.low, close: p.close 
  }));
  
  // 2b. EMA of Typical Price (Middle Line for KC)
  const tpForEma = typicalPrices.map(tp => ({ timestamp: tp.timestamp, close: tp.value }));
  const kcMiddleLineOutput = calculateEMA(tpForEma, kPeriod, 'close');

  // 2c. ATR
  // Pass original data structure to calculateATR if it expects HLC
  const atrOutput = calculateATR(data, kPeriod); // ATR period often same as Keltner EMA period

  // 3. Momentum Value (Close - SMA(Close, bPeriod))
  const priceForSma = data.map(p => ({ timestamp: p.timestamp, close: p[source]}));
  const momentumSmaOutput = calculateSMA(priceForSma, bPeriod, 'close');

  const ttmSqueezeOutput = [];

  // Align all indicator outputs by timestamp.
  // The final output will only have points where all components are available.
  // Iterate through the original data timestamps for alignment.
  for (let i = 0; i < data.length; i++) {
    const currentTimestamp = data[i].timestamp;
    const currentPrice = data[i][source];

    const bb = bbOutput.find(b => b.timestamp === currentTimestamp);
    const kcMiddle = kcMiddleLineOutput.find(kc => kc.timestamp === currentTimestamp);
    const atr = atrOutput.find(a => a.timestamp === currentTimestamp);
    const momSma = momentumSmaOutput.find(ms => ms.timestamp === currentTimestamp);

    if (bb && kcMiddle && atr && momSma) {
      const bUpper = bb.values.upper;
      const bLower = bb.values.lower;

      const kUpper = kcMiddle.value + (atr.value * kMultiplier);
      const kLower = kcMiddle.value - (atr.value * kMultiplier);

      const isSqueezeOn = (bUpper < kUpper) && (bLower > kLower);
      const momentum = currentPrice - momSma.value;
      
      ttmSqueezeOutput.push({
        timestamp: currentTimestamp,
        values: {
          isSqueezeOn: isSqueezeOn,
          momentum: momentum,
          // Optionally include band values for debugging or advanced plotting
          bUpper: bUpper,
          bLower: bLower,
          kUpper: kUpper,
          kLower: kLower,
          kcMiddle: kcMiddle.value,
          atr: atr.value
        },
      });
    } else {
      // If any component is missing for this timestamp, we can't calculate TTM Squeeze.
      // Optionally, push null or skip. For consistent length with potential for partial data:
      // Or, more simply, the loop starts when all are available.
      // The find approach naturally handles this by only proceeding if all are found.
    }
  }
  return ttmSqueezeOutput;
}

module.exports = { calculateTTMSqueeze };

console.log("TTM Squeeze function defined in financial-indicators/lib/indicators/ttm_squeeze.js");
