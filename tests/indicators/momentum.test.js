const { calculateMomentum } = require('../../lib/indicators/momentum');

describe('calculateMomentum', () => {
  const sampleData = [
    { timestamp: 1, close: 10 }, // 0
    { timestamp: 2, close: 11 }, // 1
    { timestamp: 3, close: 12 }, // 2
    { timestamp: 4, close: 10 }, // 3
    { timestamp: 5, close: 13 }, // 4
    { timestamp: 6, close: 15 }, // 5
  ];

  const period = 3;

  test('should return empty array if data length is less than or equal to period', () => {
    expect(calculateMomentum(sampleData.slice(0, period), period)).toEqual([]);
    expect(calculateMomentum(sampleData.slice(0, period - 1), period)).toEqual([]);
  });

  test('should throw error for invalid period', () => {
    expect(() => calculateMomentum(sampleData, 0)).toThrow('Period must be a positive integer.');
    expect(() => calculateMomentum(sampleData, -1)).toThrow('Period must be a positive integer.');
    expect(() => calculateMomentum(sampleData, 1.5)).toThrow('Period must be a positive integer.');
  });

  test('should calculate Momentum correctly', () => {
    const result = calculateMomentum(sampleData, period, 'close');
    // Expected length: data.length - period
    // = 6 - 3 = 3
    expect(result.length).toBe(sampleData.length - period);

    // MOM for data[3] (ts=4, close=10), period=3. Close 3 periods ago: data[0].close = 10
    // MOM = 10 - 10 = 0
    expect(result[0].timestamp).toBe(sampleData[3].timestamp);
    expect(result[0].value).toBe(0);

    // MOM for data[4] (ts=5, close=13), period=3. Close 3 periods ago: data[1].close = 11
    // MOM = 13 - 11 = 2
    expect(result[1].timestamp).toBe(sampleData[4].timestamp);
    expect(result[1].value).toBe(2);

    // MOM for data[5] (ts=6, close=15), period=3. Close 3 periods ago: data[2].close = 12
    // MOM = 15 - 12 = 3
    expect(result[2].timestamp).toBe(sampleData[5].timestamp);
    expect(result[2].value).toBe(3);
  });
  
  test('should use specified source property', () => {
    const dataWithOpen = [
        { timestamp: 1, close: 10, open: 8 },
        { timestamp: 2, close: 11, open: 9 },
        { timestamp: 3, close: 12, open: 10 },
        { timestamp: 4, close: 10, open: 11 }, // MOM based on open: 11 - 8 = 3
    ];
    const result = calculateMomentum(dataWithOpen, 3, 'open');
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(3);
  });

  test('should handle negative momentum correctly', () => {
    const dataNeg = [
        { timestamp: 1, close: 15 },
        { timestamp: 2, close: 13 },
        { timestamp: 3, close: 12 },
        { timestamp: 4, close: 10 }, // MOM: 10 - 15 = -5
    ];
    const result = calculateMomentum(dataNeg, 3, 'close');
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(-5);
  });
});

console.log("Test file for Momentum created: financial-indicators/tests/indicators/momentum.test.js");
