const { calculateROC } = require('../../lib/indicators/roc');

describe('calculateROC', () => {
  const sampleData = [
    { timestamp: 1, close: 10 }, // 0
    { timestamp: 2, close: 11 }, // 1
    { timestamp: 3, close: 12 }, // 2
    { timestamp: 4, close: 10 }, // 3
    { timestamp: 5, close: 13 }, // 4
    { timestamp: 6, close: 15 }, // 5
    { timestamp: 7, close: 0 },  // 6  (for zero value test)
    { timestamp: 8, close: 5 },  // 7
  ];

  const period = 3;

  test('should return empty array if data length is less than or equal to period', () => {
    expect(calculateROC(sampleData.slice(0, period), period)).toEqual([]);
    expect(calculateROC(sampleData.slice(0, period -1), period)).toEqual([]);
  });

  test('should throw error for invalid period', () => {
    expect(() => calculateROC(sampleData, 0)).toThrow('Period must be a positive integer.');
    expect(() => calculateROC(sampleData, -1)).toThrow('Period must be a positive integer.');
    expect(() => calculateROC(sampleData, 1.5)).toThrow('Period must be a positive integer.');
  });

  test('should calculate ROC correctly', () => {
    const result = calculateROC(sampleData, period, 'close');
    // Expected length: data.length - period
    // = 8 - 3 = 5
    expect(result.length).toBe(sampleData.length - period);

    // ROC for data[3] (ts=4, close=10), period=3. Close 3 periods ago: data[0].close = 10
    // ROC = [(10 - 10) / 10] * 100 = 0
    expect(result[0].timestamp).toBe(sampleData[3].timestamp);
    expect(result[0].value).toBeCloseTo(0);

    // ROC for data[4] (ts=5, close=13), period=3. Close 3 periods ago: data[1].close = 11
    // ROC = [(13 - 11) / 11] * 100 = (2 / 11) * 100 = 18.1818...
    expect(result[1].timestamp).toBe(sampleData[4].timestamp);
    expect(result[1].value).toBeCloseTo(18.1818, 4);

    // ROC for data[5] (ts=6, close=15), period=3. Close 3 periods ago: data[2].close = 12
    // ROC = [(15 - 12) / 12] * 100 = (3 / 12) * 100 = 25
    expect(result[2].timestamp).toBe(sampleData[5].timestamp);
    expect(result[2].value).toBeCloseTo(25);
  });
  
  test('should use specified source property', () => {
    const dataWithOpen = [
        { timestamp: 1, close: 10, open: 8 },
        { timestamp: 2, close: 11, open: 9 },
        { timestamp: 3, close: 12, open: 10 },
        { timestamp: 4, close: 10, open: 11 }, // ROC based on open: [(11-8)/8]*100 = 37.5
    ];
    const result = calculateROC(dataWithOpen, 3, 'open');
    expect(result.length).toBe(1);
    expect(result[0].value).toBeCloseTo(37.5);
  });

  test('should handle zero value in "close N periods ago"', () => {
    const result = calculateROC(sampleData, period, 'close');
    
    // ROC for data[6] (ts=7, close=0). Close 3 periods ago: data[3].close = 10.
    // ROC = [(0 - 10) / 10] * 100 = -100
    expect(result[3].timestamp).toBe(sampleData[6].timestamp);
    expect(result[3].value).toBeCloseTo(-100);

    // ROC for data[7] (ts=8, close=5). Close 3 periods ago: data[4].close = 13.
    // This is normal. The zero test is for data[i-period] being zero.
    // Let's test data[6] (ts=7, close=0) as the N-periods ago value.
    // ROC for data[6+period] = data[9]. If sampleData had data[9]
    // Current data: data[6].close = 0 (N periods ago)
    // data[7].close = 5 (current)
    // ROC with period=1: (data[7].close - data[6].close) / data[6].close * 100
    // = (5 - 0) / 0 * 100 -> Infinity
    const rocP1 = calculateROC(sampleData.slice(6, 8), 1, 'close'); // Data: [{ts:7,c:0}, {ts:8,c:5}]
    expect(rocP1.length).toBe(1);
    expect(rocP1[0].timestamp).toBe(sampleData[7].timestamp);
    expect(rocP1[0].value).toBe(Infinity);

    const dataForZeroTest = [
        { timestamp: 1, close: 0 },
        { timestamp: 2, close: 0 },
        { timestamp: 3, close: 5 },
    ];
    const rocZero1 = calculateROC(dataForZeroTest, 1, 'close');
    // rocZero1[0] (data[1]): (0-0)/0 * 100 -> 0
    expect(rocZero1[0].value).toBe(0);
    // rocZero1[1] (data[2]): (5-0)/0 * 100 -> Infinity
    expect(rocZero1[1].value).toBe(Infinity);

    const dataForNegInfinity = [
        { timestamp: 1, close: 0 },
        { timestamp: 2, close: -5 },
    ];
    const rocNegInf = calculateROC(dataForNegInfinity, 1, 'close');
    expect(rocNegInf[0].value).toBe(-Infinity);

  });
});

console.log("Test file for ROC created: financial-indicators/tests/indicators/roc.test.js");
