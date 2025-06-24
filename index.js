/**
 * @file financial-indicators/index.js
 * @description Main entry point for the Financial Technical Analysis Indicators library.
 * This file exports all available indicator calculation functions.
 */

// Data Models (if they were to be exported for consumers, not typical for calculation functions only)
// export * from './lib/data_models'; // Or specific models

// Indicator Calculation Functions
const { calculateSMA, calculateEMA, calculateWMA } = require('./lib/indicators/ma');
const { calculateMACD } = require('./lib/indicators/macd');
const { calculateADX } = require('./lib/indicators/adx');
const { calculateParabolicSAR } = require('./lib/indicators/parabolic_sar');
const { calculateIchimokuCloud } = require('./lib/indicators/ichimoku');
const { calculateRSI } = require('./lib/indicators/rsi');
const { calculateStochasticOscillator } = require('./lib/indicators/stochastic');
const { calculateCCI } = require('./lib/indicators/cci');
const { calculateROC } = require('./lib/indicators/roc');
const { calculateMomentum } = require('./lib/indicators/momentum');
const { calculateBollingerBands } = require('./lib/indicators/bollinger_bands');
const { calculateATR } = require('./lib/indicators/atr');
const { calculateOBV } = require('./lib/indicators/obv');
const { calculateVolumeIndicator } = require('./lib/indicators/volume_indicator');
const { calculateMFI } = require('./lib/indicators/mfi');
const { calculateADLine } = require('./lib/indicators/ad_line');
const { calculateTRIX } = require('./lib/indicators/trix');
const { calculatePivotPoints } = require('./lib/indicators/pivot_points');
const { calculateFibonacciRetracement } = require('./lib/indicators/fibonacci_retracement');
const { calculateVWAP } = require('./lib/indicators/vwap');
const { calculateWilliamsR } = require('./lib/indicators/williams_r');
const { calculateTTMSqueeze } = require('./lib/indicators/ttm_squeeze');
const { calculateAroon } = require('./lib/indicators/aroon');

// Data Conversion Utilities (if decided to be part of public API)
const { convertTicksToOHLCV } = require('./lib/data_conversion');


module.exports = {
  // Moving Averages
  calculateSMA,
  calculateEMA,
  calculateWMA,
  // Trend
  calculateMACD,
  calculateADX,
  calculateParabolicSAR,
  calculateIchimokuCloud,
  calculateAroon,
  // Oscillators
  calculateRSI,
  calculateStochasticOscillator,
  calculateCCI,
  calculateROC,
  calculateMomentum,
  calculateWilliamsR,
  calculateTRIX,
  // Volume-based
  calculateOBV,
  calculateVolumeIndicator, // Raw Volume and Volume SMA
  calculateMFI,
  calculateADLine, // Accumulation/Distribution Line
  calculateVWAP,
  // Volatility
  calculateBollingerBands,
  calculateATR,
  calculateTTMSqueeze,
  // Support/Resistance
  calculatePivotPoints,
  calculateFibonacciRetracement,
  // Data Conversion
  convertTicksToOHLCV,
};

console.log("Main export file (index.js) for financial-indicators library created.");
