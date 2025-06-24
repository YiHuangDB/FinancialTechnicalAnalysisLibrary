const { calculateOBV } = require('../../lib/indicators/obv');

describe('calculateOBV', () => {
  const sampleData = [
    { timestamp: 1, close: 10, volume: 100 }, // OBV[0] = 0
    { timestamp: 2, close: 11, volume: 150 }, // C > PrevC. OBV[1] = 0 + 150 = 150
    { timestamp: 3, close: 10, volume: 120 }, // C < PrevC. OBV[2] = 150 - 120 = 30
    { timestamp: 4, close: 10, volume: 110 }, // C == PrevC. OBV[3] = 30
    { timestamp: 5, close: 12, volume: 200 }, // C > PrevC. OBV[4] = 30 + 200 = 230
    { timestamp: 6, close: 11, volume: 50 },  // C < PrevC. OBV[5] = 230 - 50 = 180
  ];

  test('should return empty array if data is empty or null', () => {
    expect(calculateOBV([])).toEqual([]);
    expect(calculateOBV(null)).toEqual([]);
  });

  test('should calculate OBV correctly', () => {
    const result = calculateOBV(sampleData);
    expect(result.length).toBe(sampleData.length);

    expect(result[0].timestamp).toBe(sampleData[0].timestamp);
    expect(result[0].value).toBe(0); // First OBV is 0

    expect(result[1].timestamp).toBe(sampleData[1].timestamp);
    expect(result[1].value).toBe(150); // 0 + 150

    expect(result[2].timestamp).toBe(sampleData[2].timestamp);
    expect(result[2].value).toBe(30);  // 150 - 120

    expect(result[3].timestamp).toBe(sampleData[3].timestamp);
    expect(result[3].value).toBe(30);  // Stays 30

    expect(result[4].timestamp).toBe(sampleData[4].timestamp);
    expect(result[4].value).toBe(230); // 30 + 200
    
    expect(result[5].timestamp).toBe(sampleData[5].timestamp);
    expect(result[5].value).toBe(180); // 230 - 50
  });

  test('should handle a single data point', () => {
    const singleData = [{ timestamp: 1, close: 10, volume: 100 }];
    const result = calculateOBV(singleData);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(0);
    expect(result[0].timestamp).toBe(singleData[0].timestamp);
  });
  
  test('should handle data where volume is sometimes zero', () => {
    const dataWithZeroVol = [
      { timestamp: 1, close: 10, volume: 100 }, // OBV[0] = 0
      { timestamp: 2, close: 11, volume: 0 },   // C > PrevC. OBV[1] = 0 + 0 = 0
      { timestamp: 3, close: 10, volume: 120 }, // C < PrevC. OBV[2] = 0 - 120 = -120
      { timestamp: 4, close: 9, volume: 0 },    // C < PrevC. OBV[3] = -120 - 0 = -120
    ];
    const result = calculateOBV(dataWithZeroVol);
    expect(result.length).toBe(dataWithZeroVol.length);
    expect(result[0].value).toBe(0);
    expect(result[1].value).toBe(0);
    expect(result[2].value).toBe(-120);
    expect(result[3].value).toBe(-120);
  });

});

console.log("Test file for OBV created: financial-indicators/tests/indicators/obv.test.js");
