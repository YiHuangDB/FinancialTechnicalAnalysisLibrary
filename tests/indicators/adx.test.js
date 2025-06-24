const { calculateADX, wildersSmoothing } = require('../../lib/indicators/adx');

describe('ADX Indicator', () => {
  // Test data from: https://school.stockcharts.com/doku.php?id=technical_indicators:average_directional_index_adx
  // Calculation example data
  const stockChartsData = [
    { timestamp: 1, open: 0, high: 29.15, low: 28.30, close: 28.81, volume: 0 }, // Day 1
    { timestamp: 2, open: 0, high: 28.88, low: 28.30, close: 28.40, volume: 0 }, // Day 2
    { timestamp: 3, open: 0, high: 28.93, low: 27.94, close: 28.43, volume: 0 }, // Day 3
    { timestamp: 4, open: 0, high: 28.53, low: 28.21, close: 28.32, volume: 0 }, // Day 4
    { timestamp: 5, open: 0, high: 28.65, low: 28.03, close: 28.38, volume: 0 }, // Day 5
    { timestamp: 6, open: 0, high: 28.40, low: 27.95, close: 28.03, volume: 0 }, // Day 6
    { timestamp: 7, open: 0, high: 28.10, low: 27.62, close: 28.00, volume: 0 }, // Day 7
    { timestamp: 8, open: 0, high: 28.39, low: 27.70, close: 28.20, volume: 0 }, // Day 8
    { timestamp: 9, open: 0, high: 28.68, low: 28.14, close: 28.49, volume: 0 }, // Day 9
    { timestamp: 10, open: 0, high: 28.78, low: 28.30, close: 28.41, volume: 0 }, // Day 10
    { timestamp: 11, open: 0, high: 28.63, low: 28.04, close: 28.32, volume: 0 }, // Day 11
    { timestamp: 12, open: 0, high: 28.70, low: 28.19, close: 28.50, volume: 0 }, // Day 12
    { timestamp: 13, open: 0, high: 29.20, low: 28.50, close: 28.94, volume: 0 }, // Day 13
    { timestamp: 14, open: 0, high: 29.05, low: 28.71, close: 28.80, volume: 0 }, // Day 14 - First TR/DM smooth here
    // Add more data to get to the first ADX value for period 14
    // Need 14 TR/DM values for smoothing -> 15 days of data
    // Need 14 DX values for ADX smoothing -> 14 smoothed TR/DM values -> 14 + 14 -1 = 27 TR/DM values -> 28 days of data
    { timestamp: 15, open: 0, high: 28.90, low: 28.32, close: 28.32, volume: 0 },
    { timestamp: 16, open: 0, high: 28.32, low: 27.78, close: 28.01, volume: 0 },
    { timestamp: 17, open: 0, high: 28.15, low: 27.55, close: 27.78, volume: 0 },
    { timestamp: 18, open: 0, high: 28.20, low: 27.10, close: 28.05, volume: 0 },
    { timestamp: 19, open: 0, high: 28.30, low: 27.85, close: 27.95, volume: 0 },
    { timestamp: 20, open: 0, high: 28.00, low: 27.25, close: 27.40, volume: 0 },
    { timestamp: 21, open: 0, high: 27.50, low: 27.10, close: 27.30, volume: 0 },
    { timestamp: 22, open: 0, high: 27.45, low: 26.80, close: 27.10, volume: 0 },
    { timestamp: 23, open: 0, high: 27.20, low: 26.15, close: 26.30, volume: 0 },
    { timestamp: 24, open: 0, high: 26.60, low: 25.80, close: 26.50, volume: 0 },
    { timestamp: 25, open: 0, high: 26.80, low: 26.00, close: 26.30, volume: 0 },
    { timestamp: 26, open: 0, high: 27.00, low: 26.25, close: 26.90, volume: 0 },
    { timestamp: 27, open: 0, high: 27.10, low: 26.75, close: 26.80, volume: 0 }, // First DX value based on 14 smoothed TR/DM
                                                                              // This is data[26], (27th point)
                                                                              // Smoothed TR/DM use data up to here.
    { timestamp: 28, open: 0, high: 27.20, low: 26.80, close: 27.15, volume: 0 }, // First ADX uses DX up to here
                                                                              // This is data[27], (28th point)
    // Add 13 more for a total of 14 DX values for the first ADX smoothing
    // First ADX point is aligned with the 14th DX point.
    // 14th DX point is from the 14th smoothed TR/DM (+13 from first smoothed TR/DM).
    // First smoothed TR/DM is from data[13] (14th point).
    // So 14th smoothed TR/DM is from data[13+13] = data[26] (27th point). This is timestamp 27.
    // This is the timestamp of the 14th DX value.
    // The first ADX value corresponds to data point 26 + 14 -1 = 39 (40th data point) if period is 14.
    // My ADX code has first ADX at data[2*period-1] = data[27] (ts=28)
    // Let's make data long enough: 2*14 - 1 + 14 -1 = 27 + 13 = 40 data points.
    // So need data up to index 39 (timestamp 40).
    // Current length is 28. Need 12 more.
    // For period 14, min length is 3*14-1 = 41. So we need 41 data points.
    { timestamp: 29, open: 0, high: 27.30, low: 26.90, close: 27.20, volume: 0 },
    { timestamp: 30, open: 0, high: 27.40, low: 27.00, close: 27.30, volume: 0 },
    { timestamp: 31, open: 0, high: 27.50, low: 27.10, close: 27.40, volume: 0 },
    { timestamp: 32, open: 0, high: 27.60, low: 27.20, close: 27.50, volume: 0 },
    { timestamp: 33, open: 0, high: 27.70, low: 27.30, close: 27.60, volume: 0 },
    { timestamp: 34, open: 0, high: 27.80, low: 27.40, close: 27.70, volume: 0 },
    { timestamp: 35, open: 0, high: 27.90, low: 27.50, close: 27.80, volume: 0 },
    { timestamp: 36, open: 0, high: 28.00, low: 27.60, close: 27.90, volume: 0 },
    { timestamp: 37, open: 0, high: 28.10, low: 27.70, close: 28.00, volume: 0 },
    { timestamp: 38, open: 0, high: 28.20, low: 27.80, close: 28.10, volume: 0 },
    { timestamp: 39, open: 0, high: 28.30, low: 27.90, close: 28.20, volume: 0 }, 
    { timestamp: 40, open: 0, high: 28.40, low: 28.00, close: 28.30, volume: 0 }, 
    { timestamp: 41, open: 0, high: 28.50, low: 28.10, close: 28.40, volume: 0 }, // 41st point, data[40]
  ];

  // describe('wildersSmoothing', () => { // Tests for wildersSmoothing (now in utils.js) should be in utils.test.js
  //   test('should calculate Wilder\'s Smoothing correctly', () => {
  //     const data = [10, 11, 12, 13, 14, 15];
  //     const period = 3;
  //     // SMA for first 3: (10+11+12)/3 = 11
  //     // Next: 11 - 11/3 + 13 = 11 - 3.666 + 13 = 20.333 // This was Variant A
  //     // Corrected for Variant B (Standard SMMA): (11 * 2 + 13) / 3 = (22+13)/3 = 35/3 = 11.666
  //     const expected_variant_A = [ /* ... */ ]; // Original expectations for Variant A
  //     // const result = wildersSmoothing(data, period); // Need to import from utils
  //     // expect(result.length).toBe(data.length - period + 1);
  //     // result.forEach((val, idx) => expect(val).toBeCloseTo(expected_variant_A[idx], 3));
  //   });

  //   test('should return empty array if data length is less than period', () => {
  //     // expect(wildersSmoothing([1, 2], 3)).toEqual([]); // Need to import from utils
  //   });
  // });

  describe('calculateADX', () => {
    test('should return empty array if data length is insufficient', () => {
      // Min length for ADX period 14 is 2*14 = 28. (data[0]...data[27])
      // So, if length is 27, it's insufficient.
      expect(calculateADX(stockChartsData.slice(0, 2 * 14 - 1), 14)).toEqual([]); // length 27
      // For P=5, min length is 2*5=10. Length 9 is insufficient.
      expect(calculateADX(stockChartsData.slice(0, 2 * 5 - 1), 5)).toEqual([]); 
    });

    test('should throw error for invalid period', () => {
      expect(() => calculateADX(stockChartsData, 0)).toThrow('Period must be a positive integer.');
      expect(() => calculateADX(stockChartsData, -1)).toThrow('Period must be a positive integer.');
      expect(() => calculateADX(stockChartsData, 1.5)).toThrow('Period must be a positive integer.');
    });

    // This is a complex test. We'd ideally have a known set of ADX values for `stockChartsData`.
    // The StockCharts school example gives intermediate values but not the final ADX for a long series.
    // For now, we test structure and basic properties.
    test('should calculate ADX, PDI, NDI with correct structure for period 14', () => {
      // With 40 data points (0-39), for period 14:
      // TR/DM length: 39
      // Smoothed TR/DM/PDM/NDM length: 39 - 14 + 1 = 26. (Indices 0 to 25)
      //   - These correspond to original data indices 13 to 38. (Timestamps 14 to 39)
      // DX/PDI/NDI length: 26. (Indices 0 to 25)
      //   - These correspond to original data indices 13 to 38. (Timestamps 14 to 39)
      // ADX line length: 26 - 14 + 1 = 13. (Indices 0 to 12)
      //   - These correspond to DX indices 13 to 25.
      //   - These correspond to original data indices (13+13)=26 to (13+25)=38. (Timestamps 27 to 39)
      // My code's timestamp logic: data[k + (2 * period - 1)].timestamp
      // For k=0, ts = data[0 + 2*14-1] = data[27].timestamp = 28.
      // For k=12 (last ADX point), ts = data[12 + 27] = data[39].timestamp = 40.
      // So, output ADX length should be 13.
      
      const adxOutput = calculateADX(stockChartsData, 14); // Now stockChartsData has 40 points.
      
      // Expected length: (data.length - 1) - (period-1) - (period-1) = N-1 - p+1 -p+1 = N-2p+1
      // = 41 - 2*14 + 1 = 41 - 28 + 1 = 14
      // This is consistent with adxLine.length.
      expect(adxOutput.length).toBe(14);

      if (adxOutput.length > 0) {
        const firstPoint = adxOutput[0];
        expect(firstPoint).toHaveProperty('timestamp');
        expect(firstPoint.timestamp).toBe(stockChartsData[2 * 14 - 1].timestamp); // data[27].timestamp = 28
        
        expect(firstPoint).toHaveProperty('values');
        expect(firstPoint.values).toHaveProperty('adx');
        expect(firstPoint.values).toHaveProperty('pdi'); // +DI
        expect(firstPoint.values).toHaveProperty('ndi'); // -DI
        expect(typeof firstPoint.values.adx).toBe('number');
        expect(typeof firstPoint.values.pdi).toBe('number');
        expect(typeof firstPoint.values.ndi).toBe('number');

        const lastPoint = adxOutput[adxOutput.length - 1];
        // Last point timestamp: data[ (adxOutput.length-1) + 2*period - 1 ].timestamp
        // adxOutput.length is 14, so last index is 13.
        // = data[13 + 27].timestamp = data[40].timestamp = 41.
        expect(lastPoint.timestamp).toBe(stockChartsData[ (adxOutput.length - 1) + (2*14-1) ].timestamp);
        expect(lastPoint.timestamp).toBe(stockChartsData[40].timestamp); // data[40] is the 41st point with timestamp 41
      }
    });
    
    // To truly verify ADX, PDI, NDI values, one would need a reliable external calculator or spreadsheet.
    // For example, using the first 14 days of stockChartsData to get the first TR14, +DM14, -DM14 values:
    // Day | H    | L    | C    | TR   | +DM  | -DM  | (Data for up to day 14)
    // 1   | 29.15| 28.30| 28.81| -    | -    | -    |
    // 2   | 28.88| 28.30| 28.40| 0.85 | 0    | 0    | (H-L=0.58, H-Cp=0.07, L-Cp=0.51. TR=0.85. Up=0,Down=0) Error in manual calc.
    // TR_day2 = max(28.88-28.30, abs(28.88-28.81), abs(28.30-28.81)) = max(0.58, 0.07, 0.51) = 0.58
    // UpMove = 28.88-29.15 = -0.27. DownMove = 28.30-28.30 = 0. +DM=0, -DM=0.

    // From StockCharts example (first 14 days):
    // Sum TR = 12.14, Sum +DM14 = 2.32, Sum -DM14 = 1.80 (These are SUMS, not smoothed for 1st value)
    // My Wilder's smoothing uses SMA for the first value. So,
    // First Smoothed TR (ATR14) = 12.14 / 14 = 0.867
    // First Smoothed +DM14 = 2.32 / 14 = 0.166
    // First Smoothed -DM14 = 1.80 / 14 = 0.129
    // These would be the first values in smoothedTR, smoothedPDM, smoothedNDM arrays.
    // These correspond to data[13] (14th day, ts=14).

    // +DI14 = (0.166 / 0.867) * 100 = 19.146
    // -DI14 = (0.129 / 0.867) * 100 = 14.879
    // DX = |(19.146 - 14.879)| / (19.146 + 14.879) * 100 = |4.267| / 34.025 * 100 = 12.541
    // This is the first DX value. It corresponds to data[13] (ts=14).
    // This is dxValues[0] in my code.

    // If we had 27 data points (up to ts=27), we would have 14 DX values.
    // dxValues[0] to dxValues[13].
    // First ADX would be SMA of these 14 DX values.
    // This ADX value would align with dxValues[13], which aligns with data[13+13] = data[26] (ts=27).
    // My code aligns first ADX with data[2*period-1] = data[27] (ts=28). Let's check this alignment logic.

    // Refined timestamp logic from ADX implementation:
    // adxOutput[k].timestamp = data[k + (2 * period - 1)].timestamp
    // pdiIndex = k + period - 1; (index into pdiValues/ndiValues/dxValues)
    // pdiValues[pdiIndex] is used.
    // First ADX point (k=0): timestamp data[2*period-1]. Uses pdiValues[period-1].
    // pdiValues[period-1] corresponds to smoothedTR[period-1]
    // smoothedTR[period-1] comes from processing original data up to index (period-1) + period = 2*period-1.
    // So the PDI/NDI values used for the first ADX point are indeed from data[2*period-1]. This seems correct.

    test('should handle zero TR values correctly (avoid division by zero)', () => {
        const dataWithZeroTR = [
            { timestamp: 1, high: 10, low: 10, close: 10 }, // Day 1
            { timestamp: 2, high: 10, low: 10, close: 10 }, // Day 2, TR=0, DM=0
            { timestamp: 3, high: 10, low: 10, close: 10 }, // Day 3, TR=0, DM=0
            // ... enough data for period 2
            { timestamp: 4, high: 10, low: 10, close: 10 }, 
            { timestamp: 5, high: 10, low: 10, close: 10 }, // Min length for P=2 is 3*2-1=5 points.
        ];
        // Period 2. Min length 3*2-1 = 5.
        // TRs: [0,0,0,0] (4 values)
        // Smoothed TR (P=2): SMA(0,0)=0. Then (0 - 0/2 + 0)=0. Then (0 - 0/2 + 0)=0. -> [0,0,0]
        // Smoothed PDM/NDM also 0.
        // PDI/NDI/DX should be 0. ADX should be 0.
        const adxResult = calculateADX(dataWithZeroTR, 2);
        // Expected length for P=2, Data=5: (5-1) - (2-1) - (2-1) = 4 - 1 - 1 = 2
        expect(adxResult.length).toBe(2); 
        if (adxResult.length > 0) {
            expect(adxResult[0].values.pdi).toBe(0);
            expect(adxResult[0].values.ndi).toBe(0);
            expect(adxResult[0].values.adx).toBe(0);
        }
    });

  });
});

console.log("Test file for ADX created: financial-indicators/tests/indicators/adx.test.js");
