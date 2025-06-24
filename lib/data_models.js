/**
 * @typedef {Object} OHLCVDataPoint
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {number} open - Opening price
 * @property {number} high - Highest price
 * @property {number} low - Lowest price
 * @property {number} close - Closing price
 * @property {number} volume - Trading volume
 */

/**
 * @typedef {Array<OHLCVDataPoint>} OHLCVData
 */

/**
 * @typedef {Object} TickDataPoint
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {number} price - Trade price
 * @property {number} volume - Trade volume
 */

/**
 * @typedef {Array<TickDataPoint>} TickData
 */

/**
 * @typedef {Object} IndicatorPoint
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {number} [value] - Single value for indicators like SMA, RSI
 * @property {Object} [values] - Multiple values for indicators like MACD, Bollinger Bands
 */

/**
 * @typedef {Array<IndicatorPoint>} IndicatorOutput
 */

// Example Usage (for documentation purposes, not functional code here)

/*
const ohlcvExample = [
  { timestamp: 1678886400000, open: 100, high: 105, low: 98, close: 102, volume: 1000 },
  { timestamp: 1678886401000, open: 102, high: 103, low: 100, close: 101, volume: 800 },
];

const tickExample = [
  { timestamp: 1678886400123, price: 100.5, volume: 10 },
  { timestamp: 1678886400250, price: 100.6, volume: 5 },
];

const smaOutputExample = [
  { timestamp: 1678886400000, value: 101.5 },
  { timestamp: 1678886401000, value: 101.0 },
];

const macdOutputExample = [
  { timestamp: 1678886400000, values: { macd: 1.2, signal: 0.9, histogram: 0.3 } },
  { timestamp: 1678886401000, values: { macd: 1.3, signal: 1.0, histogram: 0.3 } },
];

const bollingerBandsOutputExample = [
  { timestamp: 1678886400000, values: { middle: 100, upper: 105, lower: 95 } },
  { timestamp: 1678886401000, values: { middle: 101, upper: 106, lower: 96 } },
];
*/
// This file primarily serves as a definition of data structures using JSDoc.
// No actual executable code is needed here unless we want to add validation functions later.

console.log("Data models defined (JSDoc).");
