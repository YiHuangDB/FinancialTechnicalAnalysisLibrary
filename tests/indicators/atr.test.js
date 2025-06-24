const { calculateATR } = require('../../lib/indicators/atr');

describe('calculateATR', () => {
  // Using data from StockCharts school ADX calculation example, as it has TR values.
  const sampleData = [ // Period P=3 for easier manual calc. First ATR at data[3] (index 3).
    // Day H     L     C      TR (calc for day i using day i-1)
    { timestamp: 1, high: 29.15, low: 28.30, close: 28.81 }, // Day 1
    { timestamp: 2, high: 28.88, low: 28.30, close: 28.40 }, // Day 2. TR = max(H-L, |H-Cp|, |L-Cp|) = max(0.58, |28.88-28.81|, |28.30-28.81|) = max(0.58, 0.07, 0.51) = 0.58. (TR1)
    { timestamp: 3, high: 28.93, low: 27.94, close: 28.43 }, // Day 3. Cp=28.40. TR = max(0.99, |28.93-28.40|, |27.94-28.40|) = max(0.99, 0.53, 0.46) = 0.99. (TR2)
    { timestamp: 4, high: 28.53, low: 28.21, close: 28.32 }, // Day 4. Cp=28.43. TR = max(0.32, |28.53-28.43|, |28.21-28.43|) = max(0.32, 0.10, 0.22) = 0.32. (TR3)
                                                            // ATR1(P3) = (0.58+0.99+0.32)/3 = 1.89/3 = 0.63
    { timestamp: 5, high: 28.65, low: 28.03, close: 28.38 }, // Day 5. Cp=28.32. TR = max(0.62, |28.65-28.32|, |28.03-28.32|) = max(0.62, 0.33, 0.29) = 0.62. (TR4)
                                                            // ATR2(P3) = (ATR1 * 2 + TR4) / 3 = (0.63 * 2 + 0.62)/3 = (1.26+0.62)/3 = 1.88/3 = 0.6266...
    { timestamp: 6, high: 28.40, low: 27.95, close: 28.03 }, // Day 6. Cp=28.38. TR = max(0.45, |28.40-28.38|, |27.95-28.38|) = max(0.45, 0.02, 0.43) = 0.45. (TR5)
                                                            // ATR3(P3) = (ATR2 * 2 + TR5) / 3 = (0.6266*2 + 0.45)/3 = (1.2532+0.45)/3 = 1.7032/3 = 0.5677...
  ];
  const period = 3;

  test('should return empty array if data length is too short', () => {
    // Needs period+1 data points. If P=3, needs 4 data points.
    expect(calculateATR(sampleData.slice(0, period), period)).toEqual([]); // length 3, needs 4
  });

  test('should throw error for invalid period', () => {
    expect(() => calculateATR(sampleData, 0)).toThrow('Period must be a positive integer.');
    expect(() => calculateATR(sampleData, -1)).toThrow('Period must be a positive integer.');
    expect(() => calculateATR(sampleData, 1.5)).toThrow('Period must be a positive integer.');
  });

  test('should calculate ATR correctly', () => {
    const result = calculateATR(sampleData, period);
    // Expected length: data.length - period
    // = 6 - 3 = 3
    expect(result.length).toBe(sampleData.length - period);

    // First ATR is at index `period` of original data (data[3], ts=4)
    expect(result[0].timestamp).toBe(sampleData[period].timestamp);
    const tr1 = 0.58;
    const tr2 = 0.99;
    const tr3 = 0.32;
    const atr1_manual = (tr1 + tr2 + tr3) / 3; // 0.63
    expect(result[0].value).toBeCloseTo(atr1_manual, 3);

    // Second ATR (data[4], ts=5)
    const tr4 = 0.62;
    const atr2_manual = (atr1_manual * (period - 1) + tr4) / period; // (0.63 * 2 + 0.62) / 3 = 0.62666...
    expect(result[1].timestamp).toBe(sampleData[period + 1].timestamp);
    expect(result[1].value).toBeCloseTo(atr2_manual, 3);

    // Third ATR (data[5], ts=6)
    const tr5 = 0.45;
    const atr3_manual = (atr2_manual * (period - 1) + tr5) / period; // (0.62666 * 2 + 0.45) / 3 = 0.56777...
    expect(result[2].timestamp).toBe(sampleData[period + 2].timestamp);
    expect(result[2].value).toBeCloseTo(atr3_manual, 3);
  });
  
  test('should handle initial flat data correctly (TR might be 0)', () => {
    const flatData = [
        { timestamp: 1, high: 10, low: 10, close: 10 },
        { timestamp: 2, high: 10, low: 10, close: 10 }, // TR1=0
        { timestamp: 3, high: 10, low: 10, close: 10 }, // TR2=0
        { timestamp: 4, high: 10, low: 10, close: 10 }, // TR3=0. ATR(P3)=0
    ];
    const result = calculateATR(flatData, 3);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(0);
  });

  test('should handle a longer period (e.g. 14) from StockCharts example', () => {
    const scFullData = [ // Data from StockCharts ATR example
        { timestamp: 1, high: 26.26, low: 25.81, close: 25.87 },
        { timestamp: 2, high: 26.13, low: 25.62, close: 26.03 }, // TR: 0.51
        { timestamp: 3, high: 26.25, low: 25.98, close: 26.00 }, // TR: 0.27
        { timestamp: 4, high: 26.14, low: 25.87, close: 26.10 }, // TR: 0.27
        { timestamp: 5, high: 26.20, low: 25.95, close: 25.98 }, // TR: 0.25
        { timestamp: 6, high: 26.00, low: 25.63, close: 25.75 }, // TR: 0.37
        { timestamp: 7, high: 25.90, low: 25.21, close: 25.21 }, // TR: 0.69
        { timestamp: 8, high: 25.69, low: 25.32, close: 25.60 }, // TR: 0.48
        { timestamp: 9, high: 25.73, low: 25.28, close: 25.47 }, // TR: 0.45
        { timestamp: 10, high: 25.50, low: 24.86, close: 25.18 }, // TR: 0.64
        { timestamp: 11, high: 25.31, low: 24.83, close: 25.29 }, // TR: 0.48
        { timestamp: 12, high: 25.38, low: 25.03, close: 25.03 }, // TR: 0.35
        { timestamp: 13, high: 25.13, low: 24.60, close: 24.66 }, // TR: 0.53
        { timestamp: 14, high: 24.81, low: 24.42, close: 24.75 }, // TR: 0.39 <- 13th TR
        { timestamp: 15, high: 25.02, low: 24.63, close: 24.88 }, // TR: 0.39 <- 14th TR. First ATR14 here.
    ];
    // TRs: 0.51,0.27,0.27,0.25,0.37,0.69,0.48,0.45,0.64,0.48,0.35,0.53,0.39,0.39
    // Sum of these 14 TRs = 6.07
    // First ATR14 = 6.07 / 14 = 0.43357
    const result = calculateATR(scFullData, 14);
    expect(result.length).toBe(scFullData.length - 14); // 15 - 14 = 1
    expect(result[0].timestamp).toBe(scFullData[14].timestamp);
    expect(result[0].value).toBeCloseTo(0.43357, 5);
  });

});

console.log("Test file for ATR created: financial-indicators/tests/indicators/atr.test.js");
