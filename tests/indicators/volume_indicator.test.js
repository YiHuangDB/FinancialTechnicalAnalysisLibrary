const { calculateVolumeIndicator } = require('../../lib/indicators/volume_indicator');

describe('calculateVolumeIndicator', () => {
  const sampleData = [
    { timestamp: 1, close: 10, volume: 100 },
    { timestamp: 2, close: 11, volume: 150 },
    { timestamp: 3, close: 10, volume: 120 },
    { timestamp: 4, close: 10, volume: 110 },
    { timestamp: 5, close: 12, volume: 200 },
  ];

  test('should return raw volume if no period is provided', () => {
    const result = calculateVolumeIndicator(sampleData);
    expect(result.length).toBe(sampleData.length);
    result.forEach((point, index) => {
      expect(point.timestamp).toBe(sampleData[index].timestamp);
      expect(point.value).toBe(sampleData[index].volume);
    });
  });

  test('should return SMA of volume if period is provided', () => {
    const period = 3;
    const result = calculateVolumeIndicator(sampleData, period);
    // SMA output length = data.length - period + 1
    expect(result.length).toBe(sampleData.length - period + 1);

    // SMA1: (100+150+120)/3 = 370/3 = 123.333
    expect(result[0].timestamp).toBe(sampleData[period - 1].timestamp); // Aligns with data[2]
    expect(result[0].value).toBeCloseTo(370 / 3, 3);

    // SMA2: (150+120+110)/3 = 380/3 = 126.666
    expect(result[1].timestamp).toBe(sampleData[period].timestamp); // Aligns with data[3]
    expect(result[1].value).toBeCloseTo(380 / 3, 3);

    // SMA3: (120+110+200)/3 = 430/3 = 143.333
    expect(result[2].timestamp).toBe(sampleData[period + 1].timestamp); // Aligns with data[4]
    expect(result[2].value).toBeCloseTo(430 / 3, 3);
  });

  test('should return empty array for SMA if data length is less than period', () => {
    expect(calculateVolumeIndicator(sampleData.slice(0, 2), 3)).toEqual([]);
  });

  test('should throw error if period is invalid (e.g., zero, negative, non-integer)', () => {
    expect(() => calculateVolumeIndicator(sampleData, 0)).toThrow('If period is provided, it must be a positive integer.');
    expect(() => calculateVolumeIndicator(sampleData, -1)).toThrow('If period is provided, it must be a positive integer.');
    expect(() => calculateVolumeIndicator(sampleData, 1.5)).toThrow('If period is provided, it must be a positive integer.');
  });
  
  test('should return empty array if input data is null or empty', () => {
    expect(calculateVolumeIndicator(null)).toEqual([]);
    expect(calculateVolumeIndicator([])).toEqual([]);
    expect(calculateVolumeIndicator(null, 3)).toEqual([]);
    expect(calculateVolumeIndicator([], 3)).toEqual([]);
  });

});

console.log("Test file for Volume Indicator created: financial-indicators/tests/indicators/volume_indicator.test.js");
