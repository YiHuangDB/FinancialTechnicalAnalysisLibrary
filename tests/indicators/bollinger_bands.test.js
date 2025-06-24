const { calculateBollingerBands } = require('../../lib/indicators/bollinger_bands');
const { calculateSMA } = require('../../lib/indicators/ma'); // For test verification if needed

describe('calculateBollingerBands', () => {
  const sampleData = [ // Period P=3. First output at index 2.
    { timestamp: 1, close: 10 },
    { timestamp: 2, close: 12 },
    { timestamp: 3, close: 11 }, // SMA(10,12,11)=11. Vals=[10,12,11]. StdDev=sqrt(((10-11)^2+(12-11)^2+(11-11)^2)/3)=sqrt((1+1+0)/3)=sqrt(2/3)=0.816
                                // UB = 11 + 2*0.816 = 12.632. LB = 11 - 2*0.816 = 9.368
    { timestamp: 4, close: 13 }, // SMA(12,11,13)=12. Vals=[12,11,13]. StdDev=sqrt(((12-12)^2+(11-12)^2+(13-12)^2)/3)=sqrt((0+1+1)/3)=sqrt(2/3)=0.816
                                // UB = 12 + 2*0.816 = 13.632. LB = 12 - 2*0.816 = 10.368
    { timestamp: 5, close: 14 }, // SMA(11,13,14)=12.667. Vals=[11,13,14]. StdDev=sqrt(((11-12.667)^2+(13-12.667)^2+(14-12.667)^2)/3)
                                // =sqrt((-1.667)^2+(0.333)^2+(1.333)^2)/3 = sqrt((2.778+0.111+1.777)/3) = sqrt(4.666/3)=sqrt(1.555)=1.247
                                // UB = 12.667 + 2*1.247 = 15.161. LB = 12.667 - 2*1.247 = 10.173
    { timestamp: 6, close: 10 },
    { timestamp: 7, close: 11 },
  ];

  const period = 3;
  const multiplier = 2;

  test('should return empty array if data length is less than period', () => {
    expect(calculateBollingerBands(sampleData.slice(0, period - 1), period, multiplier)).toEqual([]);
  });

  test('should throw error for invalid period or multiplier', () => {
    expect(() => calculateBollingerBands(sampleData, 0)).toThrow('Period must be a positive integer.');
    expect(() => calculateBollingerBands(sampleData, -1)).toThrow('Period must be a positive integer.');
    expect(() => calculateBollingerBands(sampleData, 1.5)).toThrow('Period must be a positive integer.');
    expect(() => calculateBollingerBands(sampleData, period, -1)).toThrow('Multiplier cannot be negative.');
  });

  test('should calculate Bollinger Bands correctly', () => {
    const result = calculateBollingerBands(sampleData, period, multiplier, 'close');
    // Expected length: data.length - period + 1
    // = 7 - 3 + 1 = 5
    expect(result.length).toBe(sampleData.length - period + 1);

    // Point 1 (data[2], ts=3)
    expect(result[0].timestamp).toBe(sampleData[2].timestamp);
    expect(result[0].values.middle).toBeCloseTo(11, 3);
    expect(result[0].values.upper).toBeCloseTo(11 + multiplier * Math.sqrt(2/3), 3);
    expect(result[0].values.lower).toBeCloseTo(11 - multiplier * Math.sqrt(2/3), 3);

    // Point 2 (data[3], ts=4)
    expect(result[1].timestamp).toBe(sampleData[3].timestamp);
    expect(result[1].values.middle).toBeCloseTo(12, 3);
    expect(result[1].values.upper).toBeCloseTo(12 + multiplier * Math.sqrt(2/3), 3);
    expect(result[1].values.lower).toBeCloseTo(12 - multiplier * Math.sqrt(2/3), 3);
    
    // Point 3 (data[4], ts=5)
    const sma3 = (11+13+14)/3; // 12.66666...
    const stdDev3_sq_sum = Math.pow(11-sma3,2) + Math.pow(13-sma3,2) + Math.pow(14-sma3,2);
    const stdDev3 = Math.sqrt(stdDev3_sq_sum/3); // Approx 1.247219
    expect(result[2].timestamp).toBe(sampleData[4].timestamp);
    expect(result[2].values.middle).toBeCloseTo(sma3, 3);
    expect(result[2].values.upper).toBeCloseTo(sma3 + multiplier * stdDev3, 3);
    expect(result[2].values.lower).toBeCloseTo(sma3 - multiplier * stdDev3, 3);
  });
  
  test('should use specified source property', () => {
    const dataWithOpen = [
        { timestamp: 1, close: 10, open: 8 },
        { timestamp: 2, close: 12, open: 10 },
        { timestamp: 3, close: 11, open: 11 }, // SMA(8,10,11)=9.667. Vals=[8,10,11]. StdDev=sqrt(((8-9.667)^2+(10-9.667)^2+(11-9.667)^2)/3)=1.247
    ];                                        // UB = 9.667 + 2*1.247 = 12.161. LB = 9.667 - 2*1.247 = 7.173
    const result = calculateBollingerBands(dataWithOpen, 3, 2, 'open');
    expect(result.length).toBe(1);
    const sma_open = (8+10+11)/3;
    const stdDev_open_sq_sum = Math.pow(8-sma_open,2) + Math.pow(10-sma_open,2) + Math.pow(11-sma_open,2);
    const stdDev_open = Math.sqrt(stdDev_open_sq_sum/3);

    expect(result[0].values.middle).toBeCloseTo(sma_open, 3);
    expect(result[0].values.upper).toBeCloseTo(sma_open + multiplier * stdDev_open, 3);
    expect(result[0].values.lower).toBeCloseTo(sma_open - multiplier * stdDev_open, 3);
  });

  test('should handle zero standard deviation (flat prices in period)', () => {
    const flatData = [
      { timestamp: 1, close: 10 },
      { timestamp: 2, close: 10 },
      { timestamp: 3, close: 10 }, // SMA=10, StdDev=0. UB=10, LB=10
    ];
    const result = calculateBollingerBands(flatData, 3, 2, 'close');
    expect(result.length).toBe(1);
    expect(result[0].values.middle).toBe(10);
    expect(result[0].values.upper).toBe(10);
    expect(result[0].values.lower).toBe(10);
  });

});

console.log("Test file for Bollinger Bands created: financial-indicators/tests/indicators/bollinger_bands.test.js");
