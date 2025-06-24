const { calculateAroon } = require('../../lib/indicators/aroon');

describe('calculateAroon', () => {
  // P=3. First output at index 2 (data[2])
  const sampleData = [
    { timestamp: 1, high: 10, low: 8, close: 9 },
    { timestamp: 2, high: 11, low: 7, close: 10 }, // LL for first window
    { timestamp: 3, high: 12, low: 9, close: 11 }, // HH for first window. Window [0,1,2] for data[2]
                                                   // HH=12 (0 periods ago). LL=7 (1 period ago)
                                                   // Up=((3-0)/3)*100=100. Down=((3-1)/3)*100=66.667. Osc=33.333
    { timestamp: 4, high: 10, low: 8, close: 9 },  // Window [1,2,3] for data[3]
                                                   // H=[11,12,10], L=[7,9,8]. HH=12 (1p ago), LL=7 (2p ago)
                                                   // Up=((3-1)/3)*100=66.667. Down=((3-2)/3)*100=33.333. Osc=33.333
    { timestamp: 5, high: 13, low: 9, close: 12 }, // Window [2,3,4] for data[4]
                                                   // H=[12,10,13], L=[9,8,9]. HH=13 (0p ago), LL=8 (1p ago)
                                                   // Up=((3-0)/3)*100=100. Down=((3-1)/3)*100=66.667. Osc=33.333
    { timestamp: 6, high: 11, low: 11, close: 11},// Window [3,4,5] for data[5]
                                                   // H=[10,13,11], L=[8,9,11]. HH=13 (1p ago), LL=8 (2p ago)
                                                   // Up=((3-1)/3)*100=66.667. Down=((3-2)/3)*100=33.333. Osc=33.333
  ];
  const period = 3;

  test('should return empty array if data length is less than period', () => {
    expect(calculateAroon(sampleData.slice(0, period - 1), period)).toEqual([]);
  });

  test('should throw error for invalid period', () => {
    expect(() => calculateAroon(sampleData, 0)).toThrow('Period must be a positive integer.');
    expect(() => calculateAroon(sampleData, -1)).toThrow('Period must be a positive integer.');
    expect(() => calculateAroon(sampleData, 1.5)).toThrow('Period must be a positive integer.');
  });

  test('should calculate Aroon Up, Down, and Oscillator correctly', () => {
    const result = calculateAroon(sampleData, period);
    // Expected length: data.length - period + 1
    // = 6 - 3 + 1 = 4
    expect(result.length).toBe(sampleData.length - period + 1);

    // Result[0] for data[2] (ts=3)
    // Window data[0..2]. H=[10,11,12], L=[8,7,9]. HH=12 (idx 2, 0 periods ago), LL=7 (idx 1, 1 period ago).
    expect(result[0].timestamp).toBe(sampleData[period - 1].timestamp);
    expect(result[0].values.up).toBeCloseTo(((3 - 0) / 3) * 100, 3);     // 100
    expect(result[0].values.down).toBeCloseTo(((3 - 1) / 3) * 100, 3);   // 66.667
    expect(result[0].values.oscillator).toBeCloseTo(100 - (2/3)*100, 3); // 33.333

    // Result[1] for data[3] (ts=4)
    // Window data[1..3]. H=[11,12,10], L=[7,9,8]. HH=12 (idx 2, 1 period ago), LL=7 (idx 1, 2 periods ago).
    expect(result[1].timestamp).toBe(sampleData[period].timestamp);
    expect(result[1].values.up).toBeCloseTo(((3 - 1) / 3) * 100, 3);     // 66.667
    expect(result[1].values.down).toBeCloseTo(((3 - 2) / 3) * 100, 3);   // 33.333
    expect(result[1].values.oscillator).toBeCloseTo((2/3)*100 - (1/3)*100, 3); // 33.333
    
    // Result[2] for data[4] (ts=5)
    // Window data[2..4]. H=[12,10,13], L=[9,8,9]. HH=13 (idx 4, 0 periods ago), LL=8 (idx 3, 1 period ago).
    expect(result[2].timestamp).toBe(sampleData[period + 1].timestamp);
    expect(result[2].values.up).toBeCloseTo(((3-0)/3)*100, 3);      // 100
    expect(result[2].values.down).toBeCloseTo(((3-1)/3)*100, 3);    // 66.667
    expect(result[2].values.oscillator).toBeCloseTo(100 - (2/3)*100, 3); // 33.333

    // Result[3] for data[5] (ts=6)
    // Window data[3..5]. H=[10,13,11], L=[8,9,11]. HH=13 (idx 4, 1 period ago), LL=8 (idx 3, 2 periods ago).
    expect(result[3].timestamp).toBe(sampleData[period + 2].timestamp);
    expect(result[3].values.up).toBeCloseTo(((3-1)/3)*100, 3);    // 66.667
    expect(result[3].values.down).toBeCloseTo(((3-2)/3)*100, 3);  // 33.333
    expect(result[3].values.oscillator).toBeCloseTo((2/3)*100 - (1/3)*100, 3); // 33.333
  });
  
  test('should handle cases where HH or LL is at the start/end of the period', () => {
    const edgeData = [
      { timestamp: 1, high: 10, low: 5 }, // LL
      { timestamp: 2, high: 12, low: 6 },
      { timestamp: 3, high: 15, low: 7 }, // HH
    ]; // P=3. Window data[0..2]. HH=15 (0p ago). LL=5 (2p ago).
       // Up=((3-0)/3)*100=100. Down=((3-2)/3)*100=33.333.
    let result = calculateAroon(edgeData, 3);
    expect(result.length).toBe(1);
    expect(result[0].values.up).toBeCloseTo(100, 3);
    expect(result[0].values.down).toBeCloseTo((1/3)*100, 3);

    const edgeData2 = [
      { timestamp: 1, high: 15, low: 7 }, // HH
      { timestamp: 2, high: 12, low: 6 },
      { timestamp: 3, high: 10, low: 5 }, // LL
    ]; // P=3. Window data[0..2]. HH=15 (2p ago). LL=5 (0p ago).
       // Up=((3-2)/3)*100=33.333. Down=((3-0)/3)*100=100.
    result = calculateAroon(edgeData2, 3);
    expect(result.length).toBe(1);
    expect(result[0].values.up).toBeCloseTo((1/3)*100, 3);
    expect(result[0].values.down).toBeCloseTo(100, 3);
  });

  test('output structure should contain up, down, and oscillator', () => {
    const result = calculateAroon(sampleData, period);
    if (result.length > 0) {
      expect(result[0].values).toHaveProperty('up');
      expect(result[0].values).toHaveProperty('down');
      expect(result[0].values).toHaveProperty('oscillator');
    }
  });

});

console.log("Test file for Aroon Indicator created: financial-indicators/tests/indicators/aroon.test.js");
