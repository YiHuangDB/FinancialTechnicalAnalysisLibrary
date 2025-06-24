const { calculateWilliamsR } = require('../../lib/indicators/williams_r');

describe('calculateWilliamsR', () => {
  // P=3. First output at index 2 (data[2])
  const sampleData = [
    { timestamp: 1, high: 10, low: 8, close: 9 },   // Window for data[2]: data[0..2]. HH=12, LL=8. Range=4. Close=11.
                                                    // %R = ((12-11)/4)*-100 = (1/4)*-100 = -25
    { timestamp: 2, high: 11, low: 9, close: 10 },
    { timestamp: 3, high: 12, low: 10, close: 11 },
    { timestamp: 4, high: 13, low: 11, close: 12 },  // Window for data[3]: data[1..3]. HH=13, LL=9. Range=4. Close=12.
                                                     // %R = ((13-12)/4)*-100 = (1/4)*-100 = -25
    { timestamp: 5, high: 14, low: 10, close: 10 },  // Window for data[4]: data[2..4]. HH=14, LL=10. Range=4. Close=10.
                                                     // %R = ((14-10)/4)*-100 = (4/4)*-100 = -100 (at lowest low)
    { timestamp: 6, high: 14, low: 10, close: 14 },  // Window for data[5]: data[3..5]. HH=14, LL=10. Range=4. Close=14.
                                                     // %R = ((14-14)/4)*-100 = 0 (at highest high)
    { timestamp: 7, high: 10, low: 10, close: 10 },  // Window for data[6]: data[4..6]. HH=14, LL=10. Range=4. Close=10.
                                                     // %R = ((14-10)/4)*-100 = -100
    { timestamp: 8, high: 10, low: 10, close: 10 },  // Window for data[7]: data[5..7]. HH=14, LL=10. Range=4. Close=10
                                                     // %R = ((14-10)/4)*-100 = -100
  ];
  const period = 3;

  test('should return empty array if data length is less than period', () => {
    expect(calculateWilliamsR(sampleData.slice(0, period - 1), period)).toEqual([]);
  });

  test('should throw error for invalid period', () => {
    expect(() => calculateWilliamsR(sampleData, 0)).toThrow('Period must be a positive integer.');
    expect(() => calculateWilliamsR(sampleData, -1)).toThrow('Period must be a positive integer.');
    expect(() => calculateWilliamsR(sampleData, 1.5)).toThrow('Period must be a positive integer.');
  });

  test('should calculate Williams %R correctly', () => {
    const result = calculateWilliamsR(sampleData, period);
    expect(result.length).toBe(sampleData.length - period + 1);

    expect(result[0].timestamp).toBe(sampleData[period - 1].timestamp);
    expect(result[0].value).toBeCloseTo(-25, 3);

    expect(result[1].timestamp).toBe(sampleData[period].timestamp);
    expect(result[1].value).toBeCloseTo(-25, 3);

    expect(result[2].timestamp).toBe(sampleData[period + 1].timestamp);
    expect(result[2].value).toBeCloseTo(-100, 3);
    
    expect(result[3].timestamp).toBe(sampleData[period + 2].timestamp);
    expect(result[3].value).toBeCloseTo(0, 3);

    expect(result[4].timestamp).toBe(sampleData[period + 3].timestamp);
    expect(result[4].value).toBeCloseTo(-100, 3);
    
    expect(result[5].timestamp).toBe(sampleData[period + 4].timestamp);
    expect(result[5].value).toBeCloseTo(-100, 3);
  });

  test('should handle zero range (flat prices in period)', () => {
    const flatData = [
      { timestamp: 1, high: 10, low: 10, close: 10 },
      { timestamp: 2, high: 10, low: 10, close: 10 },
      { timestamp: 3, high: 10, low: 10, close: 10 }, 
    ];
    const result = calculateWilliamsR(flatData, 3);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(0); 
  });

});

console.log("Test file for Williams %R created: financial-indicators/tests/indicators/williams_r.test.js");
