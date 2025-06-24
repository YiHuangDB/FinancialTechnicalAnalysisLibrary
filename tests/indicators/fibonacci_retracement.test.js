const { calculateFibonacciRetracement } = require('../../lib/indicators/fibonacci_retracement');

describe('calculateFibonacciRetracement', () => {
  const sampleData = [
    // P=3. First output at index 2 (data[2])
    { timestamp: 1, high: 10, low: 8, close: 9 },  // Window 1 (for data[2]): LL=8, HH=12. Range=4
    { timestamp: 2, high: 11, low: 9, close: 10 }, // Levels for data[2]: 8, 8.944, 9.528, 10, 10.472, 12
    { timestamp: 3, high: 12, low: 10, close: 11 },
    { timestamp: 4, high: 13, low: 11, close: 12 },// Window 2 (for data[3]): LL=9, HH=13. Range=4
                                                 // Levels for data[3]: 9, 9.944, 10.528, 11, 11.472, 13
    { timestamp: 5, high: 10, low: 10, close: 10 },// Window 3 (for data[4]): LL=10, HH=13. Range=3
                                                 // Levels for data[4]: 10, 10.708, 11.146, 11.5, 11.854, 13
                                                 // Window for data[4] using P=3 is data[2,3,4]. HH=13, LL=10. Range=3.
                                                 // L0=10, L236=10+0.236*3=10.708, L382=10+0.382*3=11.146, L50=11.5, L618=11.854, L100=13
    { timestamp: 6, high: 10, low: 10, close: 10 }, // Window for data[5] using P=3 is data[3,4,5]. HH=13, LL=10. Range=3. (Same as above)
    { timestamp: 7, high: 10, low: 10, close: 10 }, // Window for data[6] using P=3 is data[4,5,6]. HH=10, LL=10. Range=0. Levels all 10.

  ];
  const period = 3;
  const fibRatios = { // For verification
    level0: 0,
    level236: 0.236,
    level382: 0.382,
    level500: 0.500,
    level618: 0.618,
    level100: 1.0,
  };

  test('should return empty array if data length is less than period', () => {
    expect(calculateFibonacciRetracement(sampleData.slice(0, period - 1), period)).toEqual([]);
  });

  test('should throw error for invalid period', () => {
    expect(() => calculateFibonacciRetracement(sampleData, 0)).toThrow('Period must be a positive integer.');
    expect(() => calculateFibonacciRetracement(sampleData, -1)).toThrow('Period must be a positive integer.');
    expect(() => calculateFibonacciRetracement(sampleData, 1.5)).toThrow('Period must be a positive integer.');
  });

  test('should calculate Fibonacci Retracement levels correctly', () => {
    const result = calculateFibonacciRetracement(sampleData, period);
    // Expected length: data.length - period + 1
    // = 7 - 3 + 1 = 5
    expect(result.length).toBe(sampleData.length - period + 1);

    // Result[0] is for data[2] (timestamp 3)
    // Window for data[2] is data[0,1,2]: H=[10,11,12], L=[8,9,10] -> HH=12, LL=8. Range=4.
    expect(result[0].timestamp).toBe(sampleData[period - 1].timestamp);
    let hh = 12, ll = 8, range = hh - ll;
    expect(result[0].values.rangeHigh).toBe(hh);
    expect(result[0].values.rangeLow).toBe(ll);
    expect(result[0].values.level0).toBeCloseTo(ll + fibRatios.level0 * range, 3);
    expect(result[0].values.level236).toBeCloseTo(ll + fibRatios.level236 * range, 3);
    expect(result[0].values.level382).toBeCloseTo(ll + fibRatios.level382 * range, 3);
    expect(result[0].values.level500).toBeCloseTo(ll + fibRatios.level500 * range, 3);
    expect(result[0].values.level618).toBeCloseTo(ll + fibRatios.level618 * range, 3);
    expect(result[0].values.level100).toBeCloseTo(ll + fibRatios.level100 * range, 3);

    // Result[1] is for data[3] (timestamp 4)
    // Window for data[3] is data[1,2,3]: H=[11,12,13], L=[9,10,11] -> HH=13, LL=9. Range=4.
    expect(result[1].timestamp).toBe(sampleData[period].timestamp);
    hh = 13; ll = 9; range = hh - ll;
    expect(result[1].values.rangeHigh).toBe(hh);
    expect(result[1].values.rangeLow).toBe(ll);
    expect(result[1].values.level236).toBeCloseTo(ll + fibRatios.level236 * range, 3);

    // Result[2] is for data[4] (timestamp 5)
    // Window for data[4] is data[2,3,4]: H=[12,13,10], L=[10,11,10] -> HH=13, LL=10. Range=3.
    expect(result[2].timestamp).toBe(sampleData[period + 1].timestamp);
    hh = 13; ll = 10; range = hh - ll;
    expect(result[2].values.rangeHigh).toBe(hh);
    expect(result[2].values.rangeLow).toBe(ll);
    expect(result[2].values.level382).toBeCloseTo(ll + fibRatios.level382 * range, 3);
  });

  test('should handle zero range (flat prices in period)', () => {
    const result = calculateFibonacciRetracement(sampleData, period);
    // Result[4] is for data[6] (timestamp 7)
    // Window for data[6] is data[4,5,6]: H=[10,10,10], L=[10,10,10] -> HH=10, LL=10. Range=0.
    const flatPointIndex = 4; // result[4] corresponds to sampleData[6]
    expect(result[flatPointIndex].timestamp).toBe(sampleData[period - 1 + flatPointIndex].timestamp);
    const hh = 10, ll = 10;
    expect(result[flatPointIndex].values.rangeHigh).toBe(hh);
    expect(result[flatPointIndex].values.rangeLow).toBe(ll);
    Object.keys(fibRatios).forEach(key => {
      expect(result[flatPointIndex].values[key]).toBeCloseTo(ll, 3); // All levels should be equal to ll (or hh)
    });
  });
  
  test('output structure should contain all levels and range high/low', () => {
    const result = calculateFibonacciRetracement(sampleData, period);
    if (result.length > 0) {
      const firstResultValues = result[0].values;
      Object.keys(fibRatios).forEach(key => {
        expect(firstResultValues).toHaveProperty(key);
      });
      expect(firstResultValues).toHaveProperty('rangeHigh');
      expect(firstResultValues).toHaveProperty('rangeLow');
    }
  });

});

console.log("Test file for Fibonacci Retracement created: financial-indicators/tests/indicators/fibonacci_retracement.test.js");
