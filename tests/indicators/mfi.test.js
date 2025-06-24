const { calculateMFI } = require('../../lib/indicators/mfi');

describe('calculateMFI', () => {
  // Period P=3. Need P+1 = 4 data points for first MFI.
  // First MFI at index P (data[3]).
  const sampleData = [
    // H, L, C, V   TP=(H+L+C)/3      RMF=TP*V     TP Condition  PMF   NMF
    { timestamp: 1, high: 10, low: 8, close: 9, volume: 100 },  // TP0 = 9
    { timestamp: 2, high: 11, low: 9, close: 10, volume: 150 }, // TP1 = 10. RMF1=1000. TP1>TP0. PMF1=1000, NMF1=0
    { timestamp: 3, high: 10, low: 8, close: 8, volume: 120 },  // TP2 = 8.667.RMF2=1040. TP2<TP1. PMF2=0, NMF2=1040
    { timestamp: 4, high: 10, low: 8, close: 9, volume: 110 },  // TP3 = 9. RMF3=990. TP3>TP2. PMF3=990, NMF3=0.
                                                        // MFI1 (P=3): SumPMF(1-3)=1000+0+990=1990. SumNMF(1-3)=0+1040+0=1040
                                                        // MFR = 1990/1040 = 1.913. MFI = 100-(100/(1+1.913))=100-34.33=65.67
    { timestamp: 5, high: 12, low: 10, close: 12, volume: 200}, // TP4 = 11.333.RMF4=2266.6.TP4>TP3. PMF4=2266.6, NMF4=0
                                                        // MFI2 (P=3): SumPMF(2-4)=0+990+2266.6=3256.6. SumNMF(2-4)=1040+0+0=1040
                                                        // MFR = 3256.6/1040 = 3.131. MFI = 100-(100/(1+3.131))=100-24.20=75.80
    { timestamp: 6, high: 11, low: 9, close: 9, volume: 50 },   // TP5 = 9.667. RMF5=483.35.TP5<TP4. PMF5=0, NMF5=483.35
                                                        // MFI3 (P=3): SumPMF(3-5)=990+2266.6+0=3256.6. SumNMF(3-5)=0+0+483.35=483.35
                                                        // MFR = 3256.6/483.35 = 6.737. MFI = 100-(100/(1+6.737))=100-12.92=87.08
  ];
  const period = 3;

  test('should return empty array if data length is too short', () => {
    expect(calculateMFI(sampleData.slice(0, period), period)).toEqual([]); // Needs P+1 points
  });

  test('should throw error for invalid period', () => {
    expect(() => calculateMFI(sampleData, 0)).toThrow('Period must be a positive integer.');
    expect(() => calculateMFI(sampleData, -1)).toThrow('Period must be a positive integer.');
    expect(() => calculateMFI(sampleData, 1.5)).toThrow('Period must be a positive integer.');
  });

  test('should calculate MFI correctly', () => {
    const result = calculateMFI(sampleData, period);
    // Expected length: data.length - period
    // = 6 - 3 = 3
    expect(result.length).toBe(sampleData.length - period);

    // MFI1 (data[3], timestamp=4)
    expect(result[0].timestamp).toBe(sampleData[period].timestamp);
    expect(result[0].value).toBeCloseTo(70.538, 3); // Corrected: RMF1=1500. SumPMF=2490, SumNMF=1040. MFR=2.3942. MFI=70.538

    // MFI2 (data[4], timestamp=5)
    expect(result[1].timestamp).toBe(sampleData[period + 1].timestamp);
    expect(result[1].value).toBeCloseTo(75.795, 3); // Corrected: SumPMF=3256.66, SumNMF=1040. MFR=3.1314. MFI=75.795

    // MFI3 (data[5], timestamp=6)
    expect(result[2].timestamp).toBe(sampleData[period + 2].timestamp);
    expect(result[2].value).toBeCloseTo(87.07665, 5); // Corrected: SumPMF=3256.66, SumNMF=483.333. MFR=6.7375. MFI=87.0766...
  });

  test('should handle zero sumNMF (all positive flow)', () => {
    const allPositiveFlowData = [
      { timestamp: 1, high: 10, low: 8, close: 9, volume: 100 },  // TP0=9
      { timestamp: 2, high: 11, low: 9, close: 10, volume: 150 }, // TP1=10. PMF=1000
      { timestamp: 3, high: 12, low: 10, close: 11, volume: 120 },// TP2=11. PMF=1320
      { timestamp: 4, high: 13, low: 11, close: 12, volume: 110 },// TP3=12. PMF=1320. SumPMF >0, SumNMF=0. MFI=100
    ];
    const result = calculateMFI(allPositiveFlowData, 3);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(100);
  });

  test('should handle zero sumPMF and sumNMF (no net flow changes or all TPs equal)', () => {
    const noFlowData = [
      { timestamp: 1, high: 10, low: 10, close: 10, volume: 100 }, // TP0=10
      { timestamp: 2, high: 10, low: 10, close: 10, volume: 150 }, // TP1=10. PMF=0, NMF=0
      { timestamp: 3, high: 10, low: 10, close: 10, volume: 120 }, // TP2=10. PMF=0, NMF=0
      { timestamp: 4, high: 10, low: 10, close: 10, volume: 110 }, // TP3=10. PMF=0, NMF=0. SumPMF=0, SumNMF=0. MFI=50
    ];
    const result = calculateMFI(noFlowData, 3);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(50);
  });
  
  test('should handle zero sumPMF (all negative flow)', () => {
    const allNegativeFlowData = [
      { timestamp: 1, high: 13, low: 11, close: 12, volume: 100 }, // TP0=12
      { timestamp: 2, high: 12, low: 10, close: 11, volume: 150 }, // TP1=11. NMF=1650
      { timestamp: 3, high: 11, low: 9, close: 10, volume: 120 },  // TP2=10. NMF=1200
      { timestamp: 4, high: 10, low: 8, close: 9, volume: 110 },   // TP3=9. NMF=990. SumPMF=0, SumNMF >0. MFI=0
    ];
    const result = calculateMFI(allNegativeFlowData, 3);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(0);
  });

});

console.log("Test file for MFI created: financial-indicators/tests/indicators/mfi.test.js");
