const { calculateADLine } = require('../../lib/indicators/ad_line');

describe('calculateADLine', () => {
  const sampleData = [
    // H   L   C   V     MFM = ((C-L)-(H-C))/(H-L) MFV = MFM*V   A/D Line
    { timestamp: 1, high: 10, low: 8, close: 9, volume: 100 },  // MFM=((9-8)-(10-9))/(10-8)=(1-1)/2=0. MFV=0*100=0. ADL=0
    { timestamp: 2, high: 12, low: 9, close: 11, volume: 150 }, // MFM=((11-9)-(12-11))/(12-9)=(2-1)/3=1/3. MFV=(1/3)*150=50. ADL=0+50=50
    { timestamp: 3, high: 11, low: 8, close: 8, volume: 120 },  // MFM=((8-8)-(11-8))/(11-8)=(0-3)/3=-1. MFV=-1*120=-120. ADL=50-120=-70
    { timestamp: 4, high: 10, low: 10, close: 10, volume: 110}, // H=L. MFM=0. MFV=0. ADL=-70+0=-70
    { timestamp: 5, high: 13, low: 10, close: 12, volume: 200}, // MFM=((12-10)-(13-12))/(13-10)=(2-1)/3=1/3. MFV=(1/3)*200=66.667. ADL=-70+66.667=-3.333
  ];

  test('should return empty array if data is empty or null', () => {
    expect(calculateADLine([])).toEqual([]);
    expect(calculateADLine(null)).toEqual([]);
  });

  test('should calculate A/D Line correctly', () => {
    const result = calculateADLine(sampleData);
    expect(result.length).toBe(sampleData.length);

    // Point 1
    expect(result[0].timestamp).toBe(sampleData[0].timestamp);
    expect(result[0].value).toBeCloseTo(0, 3); // MFM = ((9-8)-(10-9))/(10-8) = (1-1)/2 = 0. MFV = 0. ADL = 0.

    // Point 2
    expect(result[1].timestamp).toBe(sampleData[1].timestamp);
    const mfm2 = ((11-9)-(12-11))/(12-9); // (2-1)/3 = 1/3
    const mfv2 = mfm2 * 150; // 50
    const adl2 = 0 + mfv2; // 50
    expect(result[1].value).toBeCloseTo(adl2, 3);

    // Point 3
    expect(result[2].timestamp).toBe(sampleData[2].timestamp);
    const mfm3 = ((8-8)-(11-8))/(11-8); // (0-3)/3 = -1
    const mfv3 = mfm3 * 120; // -120
    const adl3 = adl2 + mfv3; // 50 - 120 = -70
    expect(result[2].value).toBeCloseTo(adl3, 3);

    // Point 4 (H=L)
    expect(result[3].timestamp).toBe(sampleData[3].timestamp);
    const mfm4 = 0; // H=L
    const mfv4 = mfm4 * 110; // 0
    const adl4 = adl3 + mfv4; // -70 + 0 = -70
    expect(result[3].value).toBeCloseTo(adl4, 3);
    
    // Point 5
    expect(result[4].timestamp).toBe(sampleData[4].timestamp);
    const mfm5 = ((12-10)-(13-12))/(13-10); // (2-1)/3 = 1/3
    const mfv5 = mfm5 * 200; // 200/3 = 66.666...
    const adl5 = adl4 + mfv5; // -70 + 66.666... = -3.333...
    expect(result[4].value).toBeCloseTo(adl5, 3);
  });

  test('should handle a single data point', () => {
    const singleData = [{ timestamp: 1, high: 10, low: 8, close: 9, volume: 100 }];
    const result = calculateADLine(singleData);
    expect(result.length).toBe(1);
    // MFM = ((9-8)-(10-9))/(10-8) = 0. MFV = 0. ADL = 0.
    expect(result[0].value).toBeCloseTo(0, 3);
    expect(result[0].timestamp).toBe(singleData[0].timestamp);
  });
  
  test('should handle data where volume is zero', () => {
    const dataWithZeroVol = [
      { timestamp: 1, high: 10, low: 8, close: 9, volume: 100 }, // ADL=0
      { timestamp: 2, high: 12, low: 9, close: 11, volume: 0 },   // MFM=1/3. MFV=0. ADL=0+0=0
      { timestamp: 3, high: 11, low: 8, close: 8, volume: 120 },  // MFM=-1. MFV=-120. ADL=0-120=-120
    ];
    const result = calculateADLine(dataWithZeroVol);
    expect(result.length).toBe(dataWithZeroVol.length);
    expect(result[0].value).toBeCloseTo(0,3);
    expect(result[1].value).toBeCloseTo(0,3); // MFV is 0 due to volume
    expect(result[2].value).toBeCloseTo(-120,3);
  });

  test('MFM edge cases', () => {
    // Close = High (MFM = 1, if H > L)
    const closeAtHigh = [{ timestamp: 1, high: 10, low: 8, close: 10, volume: 100 }];
    // MFM = ((10-8)-(10-10))/(10-8) = (2-0)/2 = 1. MFV = 100. ADL = 100.
    let result = calculateADLine(closeAtHigh);
    expect(result[0].value).toBeCloseTo(100,3);

    // Close = Low (MFM = -1, if H > L)
    const closeAtLow = [{ timestamp: 1, high: 10, low: 8, close: 8, volume: 100 }];
    // MFM = ((8-8)-(10-8))/(10-8) = (0-2)/2 = -1. MFV = -100. ADL = -100.
    result = calculateADLine(closeAtLow);
    expect(result[0].value).toBeCloseTo(-100,3);

    // Close = Midpoint (MFM = 0)
    const closeAtMid = [{ timestamp: 1, high: 10, low: 8, close: 9, volume: 100 }];
    // MFM = ((9-8)-(10-9))/(10-8) = (1-1)/2 = 0. MFV = 0. ADL = 0.
    result = calculateADLine(closeAtMid);
    expect(result[0].value).toBeCloseTo(0,3);
  });

});

console.log("Test file for Accumulation/Distribution Line created: financial-indicators/tests/indicators/ad_line.test.js");
