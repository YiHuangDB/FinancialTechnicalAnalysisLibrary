const { calculateIchimokuCloud } = require('../../lib/indicators/ichimoku');

describe('calculateIchimokuCloud', () => {
  // Standard periods: Tenkan: 9, Kijun: 26, Senkou B: 52, Displacement: 26
  const tenkanP = 9;
  const kijunP = 26;
  const senkouBP = 52;
  const displacement = 26;

  // Generate sample data - needs to be long enough for all calculations
  // Longest direct period is Senkou B (52).
  // Chikou needs data[i + displacement] -> len > max_period + displacement
  // Senkou A/B needs data[i - displacement] -> effectively, first values appear after displacement
  // Minimum data length to see all values (non-null):
  // Kijun needs 26 periods. First Kijun at index 25.
  // Senkou B Source needs 52 periods. First Senkou B Source at index 51.
  // Senkou B value at index `displacement` (26) is from Senkou B Source at index 0 (not possible).
  // Senkou B value at index `displacement + senkouBPeriod - 1` (26 + 51 = 77) is from Senkou B Source at index 51.
  // Chikou value at index 0 is from data[26].close.
  // So, let's use a length of at least 52 + 26 = 78. Say 80 points.
  const sampleData = Array.from({ length: 80 }, (_, i) => ({
    timestamp: 1000 + i * 100, // Ensure unique timestamps
    high: 100 + i * 0.2 + Math.sin(i / 5) * 5,
    low: 90 + i * 0.2 - Math.sin(i / 3) * 5,
    close: 95 + i * 0.2 + Math.cos(i / 4) * 3,
    open: 95 + i * 0.2, // Not used by Ichimoku directly
    volume: 1000 + i * 10, // Not used
  }));

  // Helper to find HH or LL in a slice
  const getHighLowMid = (dataSlice) => {
    if (!dataSlice || dataSlice.length === 0) return null;
    let hh = -Infinity, ll = Infinity;
    dataSlice.forEach(d => {
      if (d.high > hh) hh = d.high;
      if (d.low < ll) ll = d.low;
    });
    return (hh + ll) / 2;
  };

  test('should return an array of the same length as input data', () => {
    const result = calculateIchimokuCloud(sampleData);
    expect(result.length).toBe(sampleData.length);
  });

  test('should throw error for invalid parameters', () => {
    expect(() => calculateIchimokuCloud(sampleData, 0)).toThrow();
    expect(() => calculateIchimokuCloud(sampleData, 9, 0)).toThrow();
    expect(() => calculateIchimokuCloud(sampleData, 9, 26, 0)).toThrow();
    expect(() => calculateIchimokuCloud(sampleData, 9, 26, 52, -1)).toThrow();
  });

  test('should have null for initial values where periods are not met', () => {
    const result = calculateIchimokuCloud(sampleData.slice(0, 20)); // Data too short for Kijun/SenkouB
    // Tenkan (9p) starts at index 8
    for(let i=0; i < tenkanP - 1; i++) {
        expect(result[i].values.tenkan).toBeNull();
    }
    expect(result[tenkanP - 1].values.tenkan).not.toBeNull();
    
    // Kijun (26p) needs more data than 20
    for(let i=0; i < result.length; i++) {
        expect(result[i].values.kijun).toBeNull();
    }
  });

  test('calculates Tenkan-sen correctly', () => {
    const result = calculateIchimokuCloud(sampleData, tenkanP, kijunP, senkouBP, displacement);
    const testIndex = tenkanP - 1 + 5; // e.g., index 13 for period 9
    if (testIndex < sampleData.length) {
      const expectedTenkan = getHighLowMid(sampleData.slice(testIndex - tenkanP + 1, testIndex + 1));
      expect(result[testIndex].values.tenkan).toBeCloseTo(expectedTenkan);
      expect(result[testIndex].timestamp).toBe(sampleData[testIndex].timestamp);
    }
    // Check first non-null Tenkan
    expect(result[tenkanP - 1].values.tenkan).toBeCloseTo(getHighLowMid(sampleData.slice(0, tenkanP)));
  });

  test('calculates Kijun-sen correctly', () => {
    const result = calculateIchimokuCloud(sampleData, tenkanP, kijunP, senkouBP, displacement);
    const testIndex = kijunP - 1 + 5; // e.g., index 30 for period 26
     if (testIndex < sampleData.length) {
      const expectedKijun = getHighLowMid(sampleData.slice(testIndex - kijunP + 1, testIndex + 1));
      expect(result[testIndex].values.kijun).toBeCloseTo(expectedKijun);
    }
    // Check first non-null Kijun
    expect(result[kijunP - 1].values.kijun).toBeCloseTo(getHighLowMid(sampleData.slice(0, kijunP)));
  });

  test('calculates Chikou Span (Lagging Span) correctly', () => {
    const result = calculateIchimokuCloud(sampleData, tenkanP, kijunP, senkouBP, displacement);
    // Chikou at index `i` is close from `data[i + displacement]`
    const testIndex = 5;
    if (testIndex + displacement < sampleData.length) {
      expect(result[testIndex].values.chikou).toBe(sampleData[testIndex + displacement].close);
    }
    // Chikou for last possible index
    const lastChikouIndex = sampleData.length - 1 - displacement;
    if (lastChikouIndex >=0) {
         expect(result[lastChikouIndex].values.chikou).toBe(sampleData[sampleData.length - 1].close);
    }
    // Chikou for indices where source would be out of bounds (future)
    const afterLastChikouIndex = sampleData.length - displacement;
    if (afterLastChikouIndex < sampleData.length && afterLastChikouIndex >=0) {
         expect(result[afterLastChikouIndex].values.chikou).toBeNull();
    }
  });

  test('calculates Senkou Span A (Leading Span A) correctly', () => {
    const result = calculateIchimokuCloud(sampleData, tenkanP, kijunP, senkouBP, displacement);
    // Senkou A at index `i` is (Tenkan_src + Kijun_src) / 2 from index `i - displacement`
    // To get a non-null Senkou A, `i - displacement` must be >= `kijunP - 1` (longest of Tenkan/Kijun)
    const firstPossibleSenkouAIndex = displacement + kijunP - 1;

    if (firstPossibleSenkouAIndex < sampleData.length) {
      const srcIndex = firstPossibleSenkouAIndex - displacement; // Should be kijunP - 1
      const tenkanAtSrc = getHighLowMid(sampleData.slice(srcIndex - tenkanP + 1, srcIndex + 1));
      const kijunAtSrc = getHighLowMid(sampleData.slice(srcIndex - kijunP + 1, srcIndex + 1));
      const expectedSenkouA = (tenkanAtSrc + kijunAtSrc) / 2;
      expect(result[firstPossibleSenkouAIndex].values.senkouA).toBeCloseTo(expectedSenkouA);

      // Test another point further along
      const testIndex = firstPossibleSenkouAIndex + 5;
      if (testIndex < sampleData.length) {
        const srcIndex2 = testIndex - displacement;
        const tenkanAtSrc2 = getHighLowMid(sampleData.slice(srcIndex2 - tenkanP + 1, srcIndex2 + 1));
        const kijunAtSrc2 = getHighLowMid(sampleData.slice(srcIndex2 - kijunP + 1, srcIndex2 + 1));
        const expectedSenkouA2 = (tenkanAtSrc2 + kijunAtSrc2) / 2;
        expect(result[testIndex].values.senkouA).toBeCloseTo(expectedSenkouA2);
      }
    }
    // Senkou A for indices where source would be out of bounds (too early)
    if (displacement > 0 && kijunP > 0) { // Ensure periods make sense
        const beforeFirstSenkouAIndex = displacement + kijunP - 2;
        if(beforeFirstSenkouAIndex >=0 && beforeFirstSenkouAIndex < result.length) {
            expect(result[beforeFirstSenkouAIndex].values.senkouA).toBeNull();
        }
    }
  });

  test('calculates Senkou Span B (Leading Span B) correctly', () => {
    const result = calculateIchimokuCloud(sampleData, tenkanP, kijunP, senkouBP, displacement);
    // Senkou B at index `i` is Mid(HH,LL over senkouBP) from index `i - displacement`
    // To get a non-null Senkou B, `i - displacement` must be >= `senkouBP - 1`
    const firstPossibleSenkouBIndex = displacement + senkouBP - 1;

    if (firstPossibleSenkouBIndex < sampleData.length) {
      const srcIndex = firstPossibleSenkouBIndex - displacement; // Should be senkouBP - 1
      const expectedSenkouB = getHighLowMid(sampleData.slice(srcIndex - senkouBP + 1, srcIndex + 1));
      expect(result[firstPossibleSenkouBIndex].values.senkouB).toBeCloseTo(expectedSenkouB);

      // Test another point further along
      const testIndex = firstPossibleSenkouBIndex + 5;
      if (testIndex < sampleData.length) {
        const srcIndex2 = testIndex - displacement;
        const expectedSenkouB2 = getHighLowMid(sampleData.slice(srcIndex2 - senkouBP + 1, srcIndex2 + 1));
        expect(result[testIndex].values.senkouB).toBeCloseTo(expectedSenkouB2);
      }
    }
     // Senkou B for indices where source would be out of bounds (too early)
    if (displacement > 0 && senkouBP > 0) {
        const beforeFirstSenkouBIndex = displacement + senkouBP - 2;
         if(beforeFirstSenkouBIndex >=0 && beforeFirstSenkouBIndex < result.length) {
            expect(result[beforeFirstSenkouBIndex].values.senkouB).toBeNull();
        }
    }
  });

  test('all components should have correct values at a specific future point', () => {
    // Choose an index where all components should ideally be non-null.
    // Needs: index >= kijunP-1 (for Tenkan/Kijun)
    // Needs: index >= displacement + senkouBP-1 (for Senkou B to be sourced)
    // Needs: index + displacement < data.length (for Chikou to be sourced)
    const testIndex = Math.max(kijunP - 1, displacement + senkouBP - 1 - 5); // A point where Tenkan, Kijun, and displaced SenkouB are likely calculated
                                                                         // And ensure Chikou can be sourced if possible.
                                                                         // Let's pick a specific index: 60
    // const testIndex = 60;
    // Ensure testIndex is valid and allows Chikou to be sourced if possible
    const safeTestIndex = Math.min(60, sampleData.length - 1 - displacement -1);


    if (safeTestIndex < kijunP -1) { // Not enough data for this comprehensive test point
        console.warn("Sample data too short for comprehensive Ichimoku test point, skipping advanced check.");
        return;
    }
    
    const result = calculateIchimokuCloud(sampleData, tenkanP, kijunP, senkouBP, displacement);
    const point = result[safeTestIndex];
    const dataPoint = sampleData[safeTestIndex];

    expect(point.timestamp).toBe(dataPoint.timestamp);

    // Tenkan
    const expectedTenkan = getHighLowMid(sampleData.slice(safeTestIndex - tenkanP + 1, safeTestIndex + 1));
    expect(point.values.tenkan).toBeCloseTo(expectedTenkan);

    // Kijun
    const expectedKijun = getHighLowMid(sampleData.slice(safeTestIndex - kijunP + 1, safeTestIndex + 1));
    expect(point.values.kijun).toBeCloseTo(expectedKijun);

    // Chikou
    if (safeTestIndex + displacement < sampleData.length) {
      expect(point.values.chikou).toBe(sampleData[safeTestIndex + displacement].close);
    } else {
      expect(point.values.chikou).toBeNull();
    }

    // Senkou A
    const senkouASrcIdx = safeTestIndex - displacement;
    if (senkouASrcIdx >= kijunP - 1) { // Kijun is longest period for Senkou A source
      const tenkanAtSrc = getHighLowMid(sampleData.slice(senkouASrcIdx - tenkanP + 1, senkouASrcIdx + 1));
      const kijunAtSrc = getHighLowMid(sampleData.slice(senkouASrcIdx - kijunP + 1, senkouASrcIdx + 1));
      expect(point.values.senkouA).toBeCloseTo((tenkanAtSrc + kijunAtSrc) / 2);
    } else {
      expect(point.values.senkouA).toBeNull();
    }

    // Senkou B
    const senkouBSrcIdx = safeTestIndex - displacement;
    if (senkouBSrcIdx >= senkouBP - 1) {
      const expectedSenkouB = getHighLowMid(sampleData.slice(senkouBSrcIdx - senkouBP + 1, senkouBSrcIdx + 1));
      expect(point.values.senkouB).toBeCloseTo(expectedSenkouB);
    } else {
      expect(point.values.senkouB).toBeNull();
    }
  });
});

console.log("Test file for Ichimoku Cloud created: financial-indicators/tests/indicators/ichimoku.test.js");
