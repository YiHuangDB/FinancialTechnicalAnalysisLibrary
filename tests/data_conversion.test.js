const { convertTicksToOHLCV } = require('../lib/data_conversion');

describe('convertTicksToOHLCV', () => {
  const sampleTicks = [
    { timestamp: 1678886400000, price: 100, volume: 10 }, // Bar 1 (00:00:00)
    { timestamp: 1678886401000, price: 101, volume: 5  }, // Bar 1
    { timestamp: 1678886459000, price: 102, volume: 8  }, // Bar 1 (ends at 00:00:59)
    { timestamp: 1678886460000, price: 103, volume: 12 }, // Bar 2 (00:01:00)
    { timestamp: 1678886461000, price: 104, volume: 7  }, // Bar 2
    { timestamp: 1678886519000, price: 103.5, volume: 9}, // Bar 2 (ends at 00:01:59)
    { timestamp: 1678886520000, price: 105, volume: 20 }, // Bar 3 (00:02:00)
  ];

  test('should convert ticks to 1-minute OHLCV bars', () => {
    const ohlcv = convertTicksToOHLCV(sampleTicks, '1min');
    expect(ohlcv).toEqual([
      { timestamp: 1678886400000, open: 100, high: 102, low: 100, close: 102, volume: 23 },
      { timestamp: 1678886460000, open: 103, high: 104, low: 103, close: 103.5, volume: 28 },
      { timestamp: 1678886520000, open: 105, high: 105, low: 105, close: 105, volume: 20 },
    ]);
  });

  test('should convert ticks to 2-minute OHLCV bars', () => {
    const ohlcv = convertTicksToOHLCV(sampleTicks, '2min');
    expect(ohlcv).toEqual([
      { timestamp: 1678886400000, open: 100, high: 104, low: 100, close: 103.5, volume: 51 },
      { timestamp: 1678886520000, open: 105, high: 105, low: 105, close: 105, volume: 20 },
    ]);
  });

  test('should handle empty tick array', () => {
    const ohlcv = convertTicksToOHLCV([], '1min');
    expect(ohlcv).toEqual([]);
  });

  test('should handle ticks that form a single bar', () => {
    const singleBarTicks = [
      { timestamp: 1678886400000, price: 100, volume: 10 },
      { timestamp: 1678886401000, price: 101, volume: 5  },
    ];
    const ohlcv = convertTicksToOHLCV(singleBarTicks, '1min');
    expect(ohlcv).toEqual([
      { timestamp: 1678886400000, open: 100, high: 101, low: 100, close: 101, volume: 15 },
    ]);
  });

  test('should correctly handle timeframes like 5min, 1H, 1D', () => {
    const ticksForHour = [
      { timestamp: 1678886400000, price: 100, volume: 10 }, // 10:00:00
      { timestamp: 1678886400000 + 30 * 60 * 1000, price: 105, volume: 20 }, // 10:30:00
      { timestamp: 1678886400000 + 59 * 60 * 1000, price: 102, volume: 15 }, // 10:59:00 (still in the same 1H bar)
      { timestamp: 1678886400000 + 60 * 60 * 1000, price: 110, volume: 25 }, // 11:00:00 (next 1H bar)
    ];
    const ohlcv1H = convertTicksToOHLCV(ticksForHour, '1H');
    expect(ohlcv1H).toEqual([
      { timestamp: 1678886400000, open: 100, high: 105, low: 100, close: 102, volume: 45 },
      { timestamp: 1678886400000 + 3600000, open: 110, high: 110, low: 110, close: 110, volume: 25 },
    ]);

    const ohlcv1D = convertTicksToOHLCV(ticksForHour, '1D');
     // Assuming 1678886400000 is the start of a day UTC for simplicity
    const startOfDay = Math.floor(1678886400000 / (24*60*60*1000)) * (24*60*60*1000);
    expect(ohlcv1D).toEqual([
       { timestamp: startOfDay, open: 100, high: 110, low: 100, close: 110, volume: 70 },
    ]);
  });

   test('should throw error for invalid timeframe format', () => {
    expect(() => convertTicksToOHLCV(sampleTicks, '1m')).toThrow("Unsupported timeframe: 1m. Use 'min', 'H', or 'D'.");
    expect(() => convertTicksToOHLCV(sampleTicks, '1hour')).toThrow("Unsupported timeframe: 1hour. Use 'min', 'H', or 'D'.");
    expect(() => convertTicksToOHLCV(sampleTicks, '0min')).toThrow("Invalid timeframe value: 0min");
    expect(() => convertTicksToOHLCV(sampleTicks, '-5min')).toThrow("Invalid timeframe value: -5min");
  });

  test('should handle ticks that span across midnight for daily bars', () => {
    const day1Start = new Date('2023-03-15T00:00:00.000Z').getTime();
    const ticksAcrossMidnight = [
        { timestamp: day1Start + 23 * 3600 * 1000, price: 200, volume: 50 }, // Day 1, 23:00
        { timestamp: day1Start + 23 * 3600 * 1000 + 30 * 60 * 1000, price: 205, volume: 60 }, // Day 1, 23:30
        { timestamp: day1Start + 24 * 3600 * 1000 + 1 * 3600 * 1000, price: 210, volume: 70 }, // Day 2, 01:00
        { timestamp: day1Start + 24 * 3600 * 1000 + 2 * 3600 * 1000, price: 208, volume: 80 }, // Day 2, 02:00
    ];
    const ohlcv = convertTicksToOHLCV(ticksAcrossMidnight, '1D');
    expect(ohlcv).toEqual([
        { timestamp: day1Start, open: 200, high: 205, low: 200, close: 205, volume: 110 },
        { timestamp: day1Start + 24 * 3600 * 1000, open: 210, high: 210, low: 208, close: 208, volume: 150 },
    ]);
  });

});

// To run these tests, you'll need Jest:
// 1. npm init -y
// 2. npm install --save-dev jest
// 3. Add "test": "jest" to package.json scripts
// 4. Run `npm test`
console.log("Test file for data conversion created: financial-indicators/tests/data_conversion.test.js");
