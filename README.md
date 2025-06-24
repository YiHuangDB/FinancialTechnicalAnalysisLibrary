# Financial Technical Analysis Library

A pure JavaScript library for calculating common financial technical analysis indicators. This library can process both OHLCV (Open, High, Low, Close, Volume) and tick data, and provides utilities for converting tick data into OHLCV format.

## Features

*   **Variety of Indicators**: Includes common indicators like MA (SMA, EMA, WMA), MACD, RSI, Bollinger Bands, ADX, Parabolic SAR, and many more.
*   **Flexible Input**: Accepts standard OHLCV data arrays and tick data arrays.
*   **Data Conversion**: Utility to convert tick data into OHLCV bars for various timeframes (e.g., 1min, 5min, 1H, 1D).
*   **Standardized Output**: Indicators return data in a consistent format (`{timestamp, value}` or `{timestamp, values: {...}}`), easy to integrate with charting libraries.
*   **Pure JavaScript**: No external binary dependencies, suitable for Node.js environments.
*   **Well-Tested**: Comes with a suite of unit tests to ensure reliability.

## Installation

To install the library, use npm:

```bash
npm install financial-technical-analysis --save
```
*(Note: Replace `financial-technical-analysis` with the actual package name if it's published under a different name. If it's a local project, you might use `npm link` or direct path imports.)*

## Quick Start

Here's a basic example of how to use the library:

```javascript
const ta = require('financial-technical-analysis'); // Adjust path if local

// Sample OHLCV Data (ensure your data has timestamp, open, high, low, close, volume)
const ohlcvData = [
  { timestamp: 1678886400000, open: 100, high: 105, low: 98, close: 102, volume: 1000 },
  { timestamp: 1678886460000, open: 102, high: 103, low: 100, close: 101, volume: 800 },
  { timestamp: 1678886520000, open: 101, high: 108, low: 100, close: 105, volume: 1200 },
  { timestamp: 1678886580000, open: 105, high: 110, low: 103, close: 108, volume: 1500 },
  { timestamp: 1678886640000, open: 108, high: 112, low: 107, close: 110, volume: 900 }
];

// 1. Calculate SMA (Simple Moving Average)
const smaPeriod = 3;
const smaResults = ta.calculateSMA(ohlcvData, smaPeriod, 'close');
console.log('SMA Results:', smaResults);
// Output might look like:
// SMA Results: [
//   { timestamp: 1678886520000, value: 102.666... },
//   { timestamp: 1678886580000, value: 104.666... },
//   { timestamp: 1678886640000, value: 107.666... }
// ]

// 2. Calculate MACD
const macdResults = ta.calculateMACD(ohlcvData, 12, 26, 9, 'close'); // Using default periods for short, long, signal
console.log('MACD Results:', macdResults);
// Output might look like (example structure, values depend on full data):
// MACD Results: [
//   { timestamp: ..., values: { macd: 0.5, signal: 0.4, histogram: 0.1 } },
//   ...
// ]

// 3. Convert Tick Data to OHLCV
const tickData = [
  { timestamp: 1678886400123, price: 100.5, volume: 10 },
  { timestamp: 1678886400250, price: 100.6, volume: 5 },
  { timestamp: 1678886405000, price: 100.2, volume: 12 }, // New tick in same 1-min bar
  // ... more ticks
  { timestamp: 1678886460000, price: 101.0, volume: 20 }, // Tick for the next 1-min bar
];

const ohlcvFromTicks = ta.convertTicksToOHLCV(tickData, '1min');
console.log('OHLCV from Ticks (1min):', ohlcvFromTicks);
// Output might look like:
// OHLCV from Ticks (1min): [
//   { timestamp: 1678886400000, open: 100.5, high: 100.6, low: 100.2, close: 100.2, volume: 27 },
//   { timestamp: 1678886460000, open: 101.0, high: 101.0, low: 101.0, close: 101.0, volume: 20 }
// ]
```

## API Overview

The library exports several functions for calculating technical indicators and performing data conversions.

### Data Conversion

*   `convertTicksToOHLCV(ticks, timeframe)`: Converts tick data to OHLCV bars.
    *   `ticks`: Array of `{timestamp, price, volume}`.
    *   `timeframe`: String like '1min', '5min', '1H', '1D'.
    *   Returns: Array of `{timestamp, open, high, low, close, volume}`.

### Main Indicators (Examples)

*   `calculateSMA(ohlcvData, period, source = 'close')`
*   `calculateEMA(ohlcvData, period, source = 'close')`
*   `calculateWMA(ohlcvData, period, source = 'close')`
*   `calculateMACD(ohlcvData, shortPeriod = 12, longPeriod = 26, signalPeriod = 9, source = 'close')`
*   `calculateRSI(ohlcvData, period = 14, source = 'close')`
*   `calculateBollingerBands(ohlcvData, period = 20, stdDev = 2, source = 'close')`
*   `calculateADX(ohlcvData, period = 14)`
*   `calculateParabolicSAR(ohlcvData, initialAf = 0.02, incrementAf = 0.02, maxAf = 0.20)`
*   `calculateIchimokuCloud(ohlcvData, conversionPeriod = 9, basePeriod = 26, spanBPeriod = 52, displacement = 26)`
*   ... and many more.

For detailed parameters and return values for each indicator, please refer to the JSDoc comments within the source code (primarily in `lib/indicators/` and `lib/data_models.js`).

The general output format for indicators is an array of objects:
*   Single value indicators (e.g., SMA): `[{ timestamp: number, value: number }, ...]`
*   Multi-value indicators (e.g., MACD): `[{ timestamp: number, values: { line1: number, line2: number, ... } }, ...]`

## Running Tests

To run the included unit tests:

1.  Ensure you have Node.js installed.
2.  Clone the repository (if you haven't already).
3.  Install development dependencies:
    ```bash
    npm install --save-dev jest
    # Or simply `npm install` if jest is already in devDependencies of package.json
    ```
4.  Add a test script to your `package.json` (if not present):
    ```json
    "scripts": {
      "test": "jest"
    }
    ```
5.  Run the tests:
    ```bash
    npm test
    ```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests. If you plan to add a new indicator or make significant changes, please open an issue first to discuss.

## License

This project is licensed under the MIT License. (Assuming MIT, please update if different).
```
