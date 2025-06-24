const { calculateVWAP } = require('../../lib/indicators/vwap');

describe('calculateVWAP', () => {
  const sampleData = [
    // H   L   C   V     TP=(H+L+C)/3  TP*V      CumTPV    CumV      VWAP = CumTPV/CumV
    { timestamp: 1, high:10, low:8, close:9, volume:100 }, // TP=9. TP*V=900. CumTPV=900. CumV=100. VWAP=900/100=9
    { timestamp: 2, high:11, low:9, close:10,volume:150 }, // TP=10.TP*V=1500.CumTPV=900+1500=2400.CumV=100+150=250.VWAP=2400/250=9.6
    { timestamp: 3, high:12, low:10,close:11,volume:120 }, // TP=11.TP*V=1320.CumTPV=2400+1320=3720.CumV=250+120=370.VWAP=3720/370=10.054
    { timestamp: 4, high:10, low:8, close:8, volume:0 },   // TP=8.667.TP*V=0.CumTPV=3720.CumV=370.VWAP=3720/370=10.054 (VWAP unchanged due to 0 vol)
    { timestamp: 5, high:13, low:11,close:12,volume:200 }, // TP=12.TP*V=2400.CumTPV=3720+2400=6120.CumV=370+200=570.VWAP=6120/570=10.7368
  ];

  test('should return empty array if data is empty or null', () => {
    expect(calculateVWAP([])).toEqual([]);
    expect(calculateVWAP(null)).toEqual([]);
  });

  test('should calculate VWAP correctly', () => {
    const result = calculateVWAP(sampleData);
    expect(result.length).toBe(sampleData.length);

    // Point 1
    expect(result[0].timestamp).toBe(sampleData[0].timestamp);
    expect(result[0].value).toBeCloseTo(9, 3);

    // Point 2
    expect(result[1].timestamp).toBe(sampleData[1].timestamp);
    expect(result[1].value).toBeCloseTo(9.6, 3);

    // Point 3
    expect(result[2].timestamp).toBe(sampleData[2].timestamp);
    expect(result[2].value).toBeCloseTo(3720 / 370, 3); // 10.054

    // Point 4 (zero volume)
    expect(result[3].timestamp).toBe(sampleData[3].timestamp);
    expect(result[3].value).toBeCloseTo(3720 / 370, 3); // Should be same as previous if volume is 0

    // Point 5
    expect(result[4].timestamp).toBe(sampleData[4].timestamp);
    expect(result[4].value).toBeCloseTo(6120 / 570, 3); // 10.7368...
  });

  test('should handle a single data point', () => {
    const singleData = [{ timestamp: 1, high: 10, low: 8, close: 9, volume: 100 }];
    const result = calculateVWAP(singleData);
    expect(result.length).toBe(1);
    const tp = (10+8+9)/3;
    expect(result[0].value).toBeCloseTo(tp, 3); // TP = 9
    expect(result[0].timestamp).toBe(singleData[0].timestamp);
  });
  
  test('should handle initial zero volume correctly', () => {
    const initialZeroVolData = [
      { timestamp: 1, high:10, low:8, close:9, volume:0 }, // TP=9. CumTPV=0. CumV=0. VWAP=TP=9
      { timestamp: 2, high:11, low:9, close:10,volume:150 },// TP=10.TP*V=1500.CumTPV=0+1500=1500.CumV=0+150=150.VWAP=1500/150=10
    ];
    const result = calculateVWAP(initialZeroVolData);
    expect(result.length).toBe(initialZeroVolData.length);
    
    expect(result[0].timestamp).toBe(initialZeroVolData[0].timestamp);
    const tp1 = (initialZeroVolData[0].high + initialZeroVolData[0].low + initialZeroVolData[0].close) / 3;
    expect(result[0].value).toBeCloseTo(tp1, 3); // VWAP = TP if CumVol is 0

    expect(result[1].timestamp).toBe(initialZeroVolData[1].timestamp);
    const tp2 = (initialZeroVolData[1].high + initialZeroVolData[1].low + initialZeroVolData[1].close) / 3;
    const tpv2 = tp2 * initialZeroVolData[1].volume;
    const cumV2 = initialZeroVolData[1].volume;
    expect(result[1].value).toBeCloseTo(tpv2 / cumV2, 3); // VWAP for point 2
  });

  test('should handle all zero volume correctly', () => {
    const allZeroVolData = [
      { timestamp: 1, high:10, low:8, close:9, volume:0 }, // TP1=9. VWAP=9
      { timestamp: 2, high:11, low:9, close:10,volume:0 },// TP2=10. VWAP=10
    ];
    const result = calculateVWAP(allZeroVolData);
    expect(result.length).toBe(allZeroVolData.length);
    
    const tp_az1 = (allZeroVolData[0].high + allZeroVolData[0].low + allZeroVolData[0].close) / 3;
    expect(result[0].value).toBeCloseTo(tp_az1, 3);
    
    const tp_az2 = (allZeroVolData[1].high + allZeroVolData[1].low + allZeroVolData[1].close) / 3;
    expect(result[1].value).toBeCloseTo(tp_az2, 3);
  });

});

console.log("Test file for VWAP created: financial-indicators/tests/indicators/vwap.test.js");
