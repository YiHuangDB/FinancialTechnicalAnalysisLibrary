const { calculateSMA, calculateEMA, calculateWMA } = require('../../lib/indicators/ma');

describe('Moving Averages', () => {
  const sampleOHLCV = [
    { timestamp: 1, open: 10, high: 15, low: 9, close: 10, volume: 100 }, // Oldest
    { timestamp: 2, open: 11, high: 16, low: 10, close: 11, volume: 110 },
    { timestamp: 3, open: 12, high: 17, low: 11, close: 12, volume: 120 },
    { timestamp: 4, open: 13, high: 18, low: 12, close: 13, volume: 130 },
    { timestamp: 5, open: 14, high: 19, low: 13, close: 14, volume: 140 },
    { timestamp: 6, open: 15, high: 20, low: 14, close: 15, volume: 150 }, // Newest
  ];

  const sampleOHLCVForEMA = [ // More data for EMA stability
    { timestamp: 1, close: 22.27 },
    { timestamp: 2, close: 22.19 },
    { timestamp: 3, close: 22.08 },
    { timestamp: 4, close: 22.17 },
    { timestamp: 5, close: 22.18 },
    { timestamp: 6, close: 22.13 },
    { timestamp: 7, close: 22.23 },
    { timestamp: 8, close: 22.43 },
    { timestamp: 9, close: 22.24 },
    { timestamp: 10, close: 22.29}, // 10th point, first EMA will be here for period 10
    { timestamp: 11, close: 22.15},
    { timestamp: 12, close: 22.39},
  ];


  describe('calculateSMA', () => {
    test('should calculate SMA correctly for a given period', () => {
      const sma3 = calculateSMA(sampleOHLCV, 3, 'close');
      expect(sma3.length).toBe(sampleOHLCV.length - 3 + 1);
      expect(sma3[0].value).toBeCloseTo((10 + 11 + 12) / 3); // (C1+C2+C3)/3
      expect(sma3[0].timestamp).toBe(sampleOHLCV[2].timestamp);
      expect(sma3[1].value).toBeCloseTo((11 + 12 + 13) / 3); // (C2+C3+C4)/3
      expect(sma3[1].timestamp).toBe(sampleOHLCV[3].timestamp);
      expect(sma3[sma3.length -1].value).toBeCloseTo((13+14+15)/3); // Last 3
    });

    test('should return empty array if data length is less than period', () => {
      expect(calculateSMA(sampleOHLCV, 10, 'close')).toEqual([]);
    });

    test('should throw error for non-positive integer period', () => {
      expect(() => calculateSMA(sampleOHLCV, 0)).toThrow('Period must be a positive integer.');
      expect(() => calculateSMA(sampleOHLCV, -1)).toThrow('Period must be a positive integer.');
      expect(() => calculateSMA(sampleOHLCV, 1.5)).toThrow('Period must be a positive integer.');
    });

    test('should use specified source property', () => {
        const sma2Open = calculateSMA(sampleOHLCV, 2, 'open');
        expect(sma2Open[0].value).toBeCloseTo((10+11)/2);
        expect(sma2Open[0].timestamp).toBe(sampleOHLCV[1].timestamp);
    });
  });

  describe('calculateEMA', () => {
    // EMA values can be checked against online calculators or trading platform values
    // For period 3, multiplier = 2 / (3 + 1) = 0.5
    // Data: 10, 11, 12, 13, 14, 15
    // 1. SMA for first 3: (10+11+12)/3 = 11. This is EMA1 (for timestamp 3)
    // 2. EMA2 = (13 - 11)*0.5 + 11 = 1*0.5 + 11 = 12. (for timestamp 4)
    // 3. EMA3 = (14 - 12)*0.5 + 12 = 1*0.5 + 12 = 13. (for timestamp 5)
    // 4. EMA4 = (15 - 13)*0.5 + 13 = 1*0.5 + 13 = 14. (for timestamp 6)
    test('should calculate EMA correctly for a given period', () => {
      const ema3 = calculateEMA(sampleOHLCV, 3, 'close');
      expect(ema3.length).toBe(sampleOHLCV.length - 3 + 1);
      expect(ema3[0].value).toBeCloseTo(11);
      expect(ema3[0].timestamp).toBe(sampleOHLCV[2].timestamp);
      expect(ema3[1].value).toBeCloseTo(12);
      expect(ema3[1].timestamp).toBe(sampleOHLCV[3].timestamp);
      expect(ema3[2].value).toBeCloseTo(13);
      expect(ema3[2].timestamp).toBe(sampleOHLCV[4].timestamp);
      expect(ema3[3].value).toBeCloseTo(14);
      expect(ema3[3].timestamp).toBe(sampleOHLCV[5].timestamp);
    });

    // Using values from a known source for EMA 10:
    // Prices: 22.27, 22.19, 22.08, 22.17, 22.18, 22.13, 22.23, 22.43, 22.24, 22.29 (SMA10 = 22.221)
    // Next price: 22.15. EMA = (22.15 - 22.221) * (2/11) + 22.221 = -0.071 * 0.181818 + 22.221 = -0.012909 + 22.221 = 22.20809
    // Next price: 22.39. EMA = (22.39 - 22.20809) * (2/11) + 22.20809 = 0.18191 * 0.181818 + 22.20809 = 0.033074 + 22.20809 = 22.24116
    test('should calculate EMA for period 10 (more realistic)', () => {
        const ema10 = calculateEMA(sampleOHLCVForEMA, 10, 'close');
        expect(ema10.length).toBe(sampleOHLCVForEMA.length - 10 + 1);
        expect(ema10[0].value).toBeCloseTo(22.221); // SMA as first value
        expect(ema10[0].timestamp).toBe(sampleOHLCVForEMA[9].timestamp); // 10th data point
        expect(ema10[1].value).toBeCloseTo(22.2080909, 6); // Increased precision for comparison
        expect(ema10[1].timestamp).toBe(sampleOHLCVForEMA[10].timestamp);
        expect(ema10[2].value).toBeCloseTo(22.241165, 6); // Increased precision for comparison
        expect(ema10[2].timestamp).toBe(sampleOHLCVForEMA[11].timestamp);
    });


    test('should return empty array if data length is less than period', () => {
      expect(calculateEMA(sampleOHLCV, 10, 'close')).toEqual([]);
    });

     test('should throw error for non-positive integer period', () => {
      expect(() => calculateEMA(sampleOHLCV, 0)).toThrow('Period must be a positive integer.');
      expect(() => calculateEMA(sampleOHLCV, -1)).toThrow('Period must be a positive integer.');
      expect(() => calculateEMA(sampleOHLCV, 1.5)).toThrow('Period must be a positive integer.');
    });
  });

  describe('calculateWMA', () => {
    // WMA for period 3. Weights: 1, 2, 3. Divisor = 1+2+3 = 6
    // Data: 10, 11, 12, 13, 14, 15
    // 1. WMA1: (10*1 + 11*2 + 12*3)/6 = (10+22+36)/6 = 68/6 = 11.333... (for timestamp 3)
    // 2. WMA2: (11*1 + 12*2 + 13*3)/6 = (11+24+39)/6 = 74/6 = 12.333... (for timestamp 4)
    // 3. WMA3: (12*1 + 13*2 + 14*3)/6 = (12+26+42)/6 = 80/6 = 13.333... (for timestamp 5)
    // 4. WMA4: (13*1 + 14*2 + 15*3)/6 = (13+28+45)/6 = 86/6 = 14.333... (for timestamp 6)
    test('should calculate WMA correctly for a given period', () => {
      const wma3 = calculateWMA(sampleOHLCV, 3, 'close');
      expect(wma3.length).toBe(sampleOHLCV.length - 3 + 1);
      expect(wma3[0].value).toBeCloseTo(68 / 6);
      expect(wma3[0].timestamp).toBe(sampleOHLCV[2].timestamp);
      expect(wma3[1].value).toBeCloseTo(74 / 6);
      expect(wma3[1].timestamp).toBe(sampleOHLCV[3].timestamp);
      expect(wma3[2].value).toBeCloseTo(80 / 6);
      expect(wma3[2].timestamp).toBe(sampleOHLCV[4].timestamp);
      expect(wma3[3].value).toBeCloseTo(86 / 6);
      expect(wma3[3].timestamp).toBe(sampleOHLCV[5].timestamp);
    });

    test('should return empty array if data length is less than period', () => {
      expect(calculateWMA(sampleOHLCV, 10, 'close')).toEqual([]);
    });

    test('should throw error for non-positive integer period', () => {
      expect(() => calculateWMA(sampleOHLCV, 0)).toThrow('Period must be a positive integer.');
      expect(() => calculateWMA(sampleOHLCV, -1)).toThrow('Period must be a positive integer.');
      expect(() => calculateWMA(sampleOHLCV, 1.5)).toThrow('Period must be a positive integer.');
    });
  });
});

// Reminder: To run these tests:
// 1. Ensure Jest is installed (npm install --save-dev jest)
// 2. Add "test": "jest" to package.json scripts
// 3. Run `npm test` or `npx jest`
console.log("Test file for Moving Averages created: financial-indicators/tests/indicators/ma.test.js");
