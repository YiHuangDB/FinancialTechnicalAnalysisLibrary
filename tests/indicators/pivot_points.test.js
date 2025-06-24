const { calculatePivotPoints } = require('../../lib/indicators/pivot_points');

describe('calculatePivotPoints', () => {
  const sampleData = [
    // Prev Day: H, L, C used for Next Day's Pivots
    { timestamp: 1, high: 100, low: 90, close: 95 }, // Day 1 data (used for Day 2 pivots)
    { timestamp: 2, high: 105, low: 95, close: 102 },// Day 2 data (pivots FOR this day are calc'd from Day 1)
                                                    // PP = (100+90+95)/3 = 285/3 = 95
                                                    // S1 = (95*2)-100 = 190-100 = 90
                                                    // R1 = (95*2)-90 = 190-90 = 100
                                                    // S2 = 95-(100-90) = 95-10 = 85
                                                    // R2 = 95+(100-90) = 95+10 = 105
                                                    // S3 = 90 - 2*(100-95) = 90 - 2*5 = 90-10 = 80
                                                    // R3 = 100 + 2*(95-90) = 100 + 2*5 = 100+10 = 110
    { timestamp: 3, high: 110, low: 100, close: 108},// Day 3 data (pivots FOR this day are calc'd from Day 2)
                                                    // PrevH=105, PrevL=95, PrevC=102
                                                    // PP = (105+95+102)/3 = 302/3 = 100.666...
                                                    // S1 = (100.666*2)-105 = 201.333-105 = 96.333
                                                    // R1 = (100.666*2)-95 = 201.333-95 = 106.333
                                                    // S2 = 100.666-(105-95) = 100.666-10 = 90.666
                                                    // R2 = 100.666+(105-95) = 100.666+10 = 110.666
                                                    // S3 = 95 - 2*(105-100.666) = 95 - 2*4.333 = 95-8.666 = 86.333
                                                    // R3 = 105 + 2*(100.666-95) = 105 + 2*5.666 = 105+11.333 = 116.333
    { timestamp: 4, high: 100, low: 90, close: 95 }, // Day 4 data
  ];

  test('should return empty array if data length is less than 2', () => {
    expect(calculatePivotPoints(sampleData.slice(0, 1))).toEqual([]);
    expect(calculatePivotPoints([])).toEqual([]);
    expect(calculatePivotPoints(null)).toEqual([]);
  });

  test('should calculate Pivot Points correctly', () => {
    const result = calculatePivotPoints(sampleData);
    // Expected length: data.length - 1
    expect(result.length).toBe(sampleData.length - 1);

    // Pivots for Day 2 (result[0]), using Day 1 data (sampleData[0])
    const day1 = sampleData[0];
    const pp1_manual = (day1.high + day1.low + day1.close) / 3;
    const s1_1_manual = (pp1_manual * 2) - day1.high;
    const r1_1_manual = (pp1_manual * 2) - day1.low;
    const s2_1_manual = pp1_manual - (day1.high - day1.low);
    const r2_1_manual = pp1_manual + (day1.high - day1.low);
    const s3_1_manual = day1.low - 2 * (day1.high - pp1_manual);
    const r3_1_manual = day1.high + 2 * (pp1_manual - day1.low);

    expect(result[0].timestamp).toBe(sampleData[1].timestamp);
    expect(result[0].values.pp).toBeCloseTo(pp1_manual, 3);
    expect(result[0].values.s1).toBeCloseTo(s1_1_manual, 3);
    expect(result[0].values.r1).toBeCloseTo(r1_1_manual, 3);
    expect(result[0].values.s2).toBeCloseTo(s2_1_manual, 3);
    expect(result[0].values.r2).toBeCloseTo(r2_1_manual, 3);
    expect(result[0].values.s3).toBeCloseTo(s3_1_manual, 3);
    expect(result[0].values.r3).toBeCloseTo(r3_1_manual, 3);

    // Pivots for Day 3 (result[1]), using Day 2 data (sampleData[1])
    const day2 = sampleData[1];
    const pp2_manual = (day2.high + day2.low + day2.close) / 3;
    const s1_2_manual = (pp2_manual * 2) - day2.high;
    const r1_2_manual = (pp2_manual * 2) - day2.low;
    const s2_2_manual = pp2_manual - (day2.high - day2.low);
    const r2_2_manual = pp2_manual + (day2.high - day2.low);
    const s3_2_manual = day2.low - 2 * (day2.high - pp2_manual);
    const r3_2_manual = day2.high + 2 * (pp2_manual - day2.low);
    
    expect(result[1].timestamp).toBe(sampleData[2].timestamp);
    expect(result[1].values.pp).toBeCloseTo(pp2_manual, 3);
    expect(result[1].values.s1).toBeCloseTo(s1_2_manual, 3);
    expect(result[1].values.r1).toBeCloseTo(r1_2_manual, 3);
    expect(result[1].values.s2).toBeCloseTo(s2_2_manual, 3);
    expect(result[1].values.r2).toBeCloseTo(r2_2_manual, 3);
    expect(result[1].values.s3).toBeCloseTo(s3_2_manual, 3);
    expect(result[1].values.r3).toBeCloseTo(r3_2_manual, 3);
  });
  
  test('output structure should contain all pivot levels', () => {
    const result = calculatePivotPoints(sampleData);
    if (result.length > 0) {
      expect(result[0].values).toHaveProperty('pp');
      expect(result[0].values).toHaveProperty('s1');
      expect(result[0].values).toHaveProperty('r1');
      expect(result[0].values).toHaveProperty('s2');
      expect(result[0].values).toHaveProperty('r2');
      expect(result[0].values).toHaveProperty('s3');
      expect(result[0].values).toHaveProperty('r3');
    }
  });

});

console.log("Test file for Pivot Points created: financial-indicators/tests/indicators/pivot_points.test.js");
