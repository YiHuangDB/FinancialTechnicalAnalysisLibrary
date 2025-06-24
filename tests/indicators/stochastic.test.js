const { calculateStochasticOscillator } = require('../../lib/indicators/stochastic');
const { calculateSMA } = require('../../lib/indicators/ma'); // For test verification

describe('calculateStochasticOscillator', () => {
  const sampleData = [ // Needs periodK + periodD -1 points for first output
    // PeriodK=5, PeriodD=3. First K at index 4. First D at index 4+3-1 = 6.
    { timestamp: 1, high: 10, low: 8, close: 9, open: 0, volume: 0 },
    { timestamp: 2, high: 11, low: 9, close: 10, open: 0, volume: 0 },
    { timestamp: 3, high: 12, low: 10, close: 11, open: 0, volume: 0 },
    { timestamp: 4, high: 13, low: 11, close: 12, open: 0, volume: 0 },
    { timestamp: 5, high: 14, low: 12, close: 13, open: 0, volume: 0 }, // K1: LL=8, HH=14. (13-8)/(14-8)*100 = 5/6*100=83.33
    { timestamp: 6, high: 15, low: 13, close: 14, open: 0, volume: 0 }, // K2: LL=9, HH=15. (14-9)/(15-9)*100 = 5/6*100=83.33
    { timestamp: 7, high: 16, low: 14, close: 15, open: 0, volume: 0 }, // K3: LL=10,HH=16. (15-10)/(16-10)*100=5/6*100=83.33. D1=(K1+K2+K3)/3
    { timestamp: 8, high: 17, low: 15, close: 16, open: 0, volume: 0 }, // K4: LL=11,HH=17. (16-11)/(17-11)*100=5/6*100=83.33. D2=(K2+K3+K4)/3
    { timestamp: 9, high: 16, low: 14, close: 14, open: 0, volume: 0 }, // K5: LL=12,HH=17. (14-12)/(17-12)*100=2/5*100=40.00. D3=(K3+K4+K5)/3
    { timestamp: 10,high: 15, low: 13, close: 15, open: 0, volume: 0 },// K6: LL=13,HH=17. (15-13)/(17-13)*100=2/4*100=50.00. D4=(K4+K5+K6)/3
  ];

  const periodK = 5;
  const periodD = 3;

  test('should return empty array if data length is too short for %K', () => {
    expect(calculateStochasticOscillator(sampleData.slice(0, periodK - 1), periodK, periodD)).toEqual([]);
  });

  test('should return empty array if data length is too short for %D', () => {
    // Enough for K, but not for D. K length = (periodK) - (periodK-1) = 1. Need periodD K's.
    // Data length periodK gives 1 K value.
    expect(calculateStochasticOscillator(sampleData.slice(0, periodK + periodD - 2), periodK, periodD)).toEqual([]);
  });


  test('should throw error for invalid periods', () => {
    expect(() => calculateStochasticOscillator(sampleData, 0, 3)).toThrow();
    expect(() => calculateStochasticOscillator(sampleData, 14, -1)).toThrow();
    expect(() => calculateStochasticOscillator(sampleData, 14.5, 3)).toThrow();
  });

  test('should calculate %K and %D correctly', () => {
    const result = calculateStochasticOscillator(sampleData, periodK, periodD);
    // Expected length: data.length - (periodK - 1) - (periodD - 1)
    // = 10 - 4 - 2 = 4
    expect(result.length).toBe(sampleData.length - (periodK - 1) - (periodD - 1));

    // K1 (for data[4], ts=5): C=13. Slice data[0..4]. LL=8 (ts=1), HH=14 (ts=5). %K = (13-8)/(14-8)*100 = 83.333
    // K2 (for data[5], ts=6): C=14. Slice data[1..5]. LL=9 (ts=2), HH=15 (ts=6). %K = (14-9)/(15-9)*100 = 83.333
    // K3 (for data[6], ts=7): C=15. Slice data[2..6]. LL=10(ts=3), HH=16 (ts=7). %K = (15-10)/(16-10)*100 = 83.333
    // D1 (for data[6], ts=7): SMA(K1,K2,K3) = (83.333*3)/3 = 83.333
    expect(result[0].timestamp).toBe(sampleData[periodK - 1 + periodD - 1].timestamp); // data[6].timestamp
    expect(result[0].values.k).toBeCloseTo(83.333, 3);
    expect(result[0].values.d).toBeCloseTo(83.333, 3);

    // K4 (for data[7], ts=8): C=16. Slice data[3..7]. LL=11(ts=4), HH=17(ts=8). %K = (16-11)/(17-11)*100 = 83.333
    // D2 (for data[7], ts=8): SMA(K2,K3,K4) = (83.333*3)/3 = 83.333
    expect(result[1].timestamp).toBe(sampleData[periodK - 1 + periodD - 1 + 1].timestamp); // data[7].timestamp
    expect(result[1].values.k).toBeCloseTo(83.333, 3);
    expect(result[1].values.d).toBeCloseTo(83.333, 3);

    // K5 (for data[8], ts=9): C=14. Slice data[4..8]. LL=12(ts=5), HH=17(ts=8). %K = (14-12)/(17-12)*100 = 40.000
    // D3 (for data[8], ts=9): SMA(K3,K4,K5) = (83.333 + 83.333 + 40.000)/3 = 206.666/3 = 68.8886
    expect(result[2].timestamp).toBe(sampleData[periodK - 1 + periodD - 1 + 2].timestamp); // data[8].timestamp
    expect(result[2].values.k).toBeCloseTo(40.000, 3);
    expect(result[2].values.d).toBeCloseTo(68.889, 3); // 206.666/3 = 68.8886...

    // K6 (for data[9], ts=10): C=15. Slice data[5..9]. LL=13(ts=6,10), HH=17(ts=8). %K = (15-13)/(17-13)*100 = 50.000
    // D4 (for data[9], ts=10): SMA(K4,K5,K6) = (83.333 + 40.000 + 50.000)/3 = 173.333/3 = 57.7776
    expect(result[3].timestamp).toBe(sampleData[periodK - 1 + periodD - 1 + 3].timestamp); // data[9].timestamp
    expect(result[3].values.k).toBeCloseTo(50.000, 3);
    expect(result[3].values.d).toBeCloseTo(57.778, 3); // 173.333/3 = 57.7776...
  });

  test('should handle zero range for %K (HighestHigh equals LowestLow)', () => {
    const flatData = [
      { timestamp: 1, high: 10, low: 10, close: 10 },
      { timestamp: 2, high: 10, low: 10, close: 10 },
      { timestamp: 3, high: 10, low: 10, close: 10 }, // K1 for P=3. Range=0. %K=100 by convention.
      { timestamp: 4, high: 10, low: 10, close: 10 }, // K2 %K=100
      { timestamp: 5, high: 10, low: 10, close: 10 }, // K3 %K=100. D1 for P=3. SMA(100,100,100)=100.
    ];
    const result = calculateStochasticOscillator(flatData, 3, 3);
    expect(result.length).toBe(1); // 5 - (3-1) - (3-1) = 5 - 2 - 2 = 1
    expect(result[0].values.k).toBe(100);
    expect(result[0].values.d).toBe(100);
  });

  test('should handle %K values of 0 and 100 correctly in %D calculation', () => {
    const edgeKData = [
        { timestamp: 1, high: 20, low: 10, close: 10 }, // K for P=1: (10-10)/(20-10)*100 = 0
        { timestamp: 2, high: 20, low: 10, close: 20 }, // K for P=1: (20-10)/(20-10)*100 = 100
        { timestamp: 3, high: 20, low: 10, close: 15 }, // K for P=1: (15-10)/(20-10)*100 = 50. D for P=3: (0+100+50)/3 = 50
    ];
    const result = calculateStochasticOscillator(edgeKData, 1, 3);
    expect(result.length).toBe(1); // 3 - (1-1) - (3-1) = 3 - 0 - 2 = 1
    expect(result[0].values.k).toBe(50);
    expect(result[0].values.d).toBe(50);
  });

});

console.log("Test file for Stochastic Oscillator created: financial-indicators/tests/indicators/stochastic.test.js");
