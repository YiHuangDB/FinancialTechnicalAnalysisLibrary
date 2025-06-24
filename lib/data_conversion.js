/**
 * @typedef {import('./data_models').TickData} TickData
 * @typedef {import('./data_models').TickDataPoint} TickDataPoint
 * @typedef {import('./data_models').OHLCVData} OHLCVData
 * @typedef {import('./data_models').OHLCVDataPoint} OHLCVDataPoint
 */

/**
 * Converts an array of tick data into OHLCV data for a specified timeframe.
 *
 * @param {TickData} ticks - Array of tick data points, sorted by timestamp.
 * @param {string} timeframe - The timeframe for aggregation (e.g., '1min', '5min', '1H', '1D').
 *                             Supported units: 'min', 'H' (hour), 'D' (day).
 * @returns {OHLCVData} - Array of OHLCV data points.
 */
function convertTicksToOHLCV(ticks, timeframe) {
  if (!ticks || ticks.length === 0) {
    return [];
  }

  let intervalMillis;
  const unit = timeframe.slice(-1);
  const value = parseInt(timeframe.slice(0, -1), 10);

  if (timeframe.endsWith('min')) {
    intervalMillis = parseInt(timeframe.slice(0, -3), 10) * 60 * 1000;
  } else if (timeframe.endsWith('H')) {
    intervalMillis = parseInt(timeframe.slice(0, -1), 10) * 60 * 60 * 1000;
  } else if (timeframe.endsWith('D')) {
    intervalMillis = parseInt(timeframe.slice(0, -1), 10) * 24 * 60 * 60 * 1000;
  } else {
    throw new Error(`Unsupported timeframe: ${timeframe}. Use 'min', 'H', or 'D'.`);
  }

  if (isNaN(intervalMillis) || intervalMillis <= 0) {
    throw new Error(`Invalid timeframe value: ${timeframe}`);
  }

  const ohlcvData = [];
  if (ticks.length === 0) {
    return ohlcvData;
  }

  // Sort ticks just in case they are not pre-sorted.
  // It's generally expected that input ticks are sorted.
  const sortedTicks = [...ticks].sort((a, b) => a.timestamp - b.timestamp);

  let currentBarTimestamp = Math.floor(sortedTicks[0].timestamp / intervalMillis) * intervalMillis;
  let currentBar = {
    timestamp: currentBarTimestamp,
    open: sortedTicks[0].price,
    high: sortedTicks[0].price,
    low: sortedTicks[0].price,
    close: sortedTicks[0].price,
    volume: 0,
  };

  for (const tick of sortedTicks) {
    const barTimestampForTick = Math.floor(tick.timestamp / intervalMillis) * intervalMillis;

    if (barTimestampForTick > currentBar.timestamp) {
      // Finalize current bar and start a new one
      if (currentBar.volume > 0) { // Only add bars that had activity
          ohlcvData.push(currentBar);
      }
      
      // Handle gaps: if there are empty intervals, they are skipped.
      // Charting libraries usually handle this or one might insert empty bars if needed.
      // For now, we only create bars where there is tick data.

      currentBarTimestamp = barTimestampForTick;
      currentBar = {
        timestamp: currentBarTimestamp,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tick.volume,
      };
    } else {
      // Update current bar
      currentBar.high = Math.max(currentBar.high, tick.price);
      currentBar.low = Math.min(currentBar.low, tick.price);
      currentBar.close = tick.price;
      currentBar.volume += tick.volume;
    }
  }

  // Add the last bar
  if (currentBar.volume > 0) {
      ohlcvData.push(currentBar);
  }

  return ohlcvData;
}

module.exports = { convertTicksToOHLCV };
console.log("Tick to OHLCV conversion function defined in financial-indicators/lib/data_conversion.js");
