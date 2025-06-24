/**
 * @typedef {import('../data_models').OHLCVData} OHLCVData
 * @typedef {import('../data_models').OHLCVDataPoint} OHLCVDataPoint
 * @typedef {import('../data_models').IndicatorPoint} IndicatorPoint
 * @typedef {import('../data_models').IndicatorOutput} IndicatorOutput
 */

const { wildersSmoothing } = require('../utils'); // Using standard SMMA version

/**
 * Calculates the Average Directional Index (ADX), +DI, and -DI.
 *
 * Steps:
 * 1. Calculate True Range (TR), Positive Directional Movement (+DM), Negative Directional Movement (-DM).
 * 2. Smooth TR, +DM, -DM (typically using Wilder's smoothing method over a period, e.g., 14).
 * 3. Calculate Positive Directional Indicator (+DI) = (Smoothed +DM / Smoothed TR) * 100.
 * 4. Calculate Negative Directional Indicator (-DI) = (Smoothed -DM / Smoothed TR) * 100.
 * 5. Calculate Directional Index (DX) = |(+DI - -DI)| / |(+DI + -DI)| * 100.
 * 6. Calculate ADX = Smoothed DX (typically using Wilder's smoothing over the same period).
 *
 * @param {OHLCVData} data - Array of OHLCV data points.
 * @param {number} [period=14] - The period for smoothing and DI calculation.
 * @returns {IndicatorOutput} Array of ADX results. Each point contains a `values` object:
 *                            `{ adx: number, pdi: number, ndi: number }`.
 *                            - `adx`: Average Directional Index value.
 *                            - `pdi`: Positive Directional Indicator (+DI).
 *                            - `ndi`: Negative Directional Indicator (-DI).
 *                            Output starts when ADX can be calculated.
 *                            The first output point corresponds to original data index `data[2*period-1]`
 *                            (after enough data for initial TR/DM, first smoothing, and DX smoothing).
 */
function calculateADX(data, period = 14) {
    if (period <= 0 || !Number.isInteger(period)) {
        throw new Error('Period must be a positive integer.');
    }
    // Min length for one ADX value: 
    // TR/DM values needed: period-1 for first smoothing + period-1 for second smoothing = 2*period-2
    // Each TR/DM itself needs 2 data points, but they overlap.
    // To get `k` TR/DM values, we need `k+1` data points.
    // For the first ADX value, we need `period` DX values.
    // Each DX value comes from a smoothed TR/DM value.
    // The first smoothed TR/DM value requires `period` raw TR/DM values.
    // So, to get `period` DX values (for the first ADX smoothing), we need `period + (period-1)` raw TR/DM values.
    // This requires `period + (period-1) + 1` original data points.
    // = `2*period` original data points for the first ADX value.
    // The timestamp of this first ADX is data[2*period-1].
    // So data must have at least `2*period` elements.
    if (data.length < 2 * period) { 
        return [];
    }

    const trValues = [];
    const pdmValues = []; 
    const ndmValues = []; 

    for (let i = 1; i < data.length; i++) {
        const current = data[i];
        const previous = data[i - 1];
        const tr1 = current.high - current.low;
        const tr2 = Math.abs(current.high - previous.close);
        const tr3 = Math.abs(current.low - previous.close);
        trValues.push(Math.max(tr1, tr2, tr3));
        const upMove = current.high - previous.high;
        const downMove = previous.low - current.low;
        pdmValues.push(upMove > downMove && upMove > 0 ? upMove : 0);
        ndmValues.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }

    if (trValues.length < period) return []; 

    const smoothedTR = wildersSmoothing(trValues, period);
    const smoothedPDM = wildersSmoothing(pdmValues, period);
    const smoothedNDM = wildersSmoothing(ndmValues, period);

    const pdiValues = []; 
    const ndiValues = []; 
    const dxValues = [];  

    for (let i = 0; i < smoothedTR.length; i++) {
        const str = smoothedTR[i];
        let pdi = 0, ndi = 0, dx = 0;
        if (str !== 0) {
            pdi = (smoothedPDM[i] / str) * 100;
            ndi = (smoothedNDM[i] / str) * 100;
            const sumDI = pdi + ndi;
            if (sumDI !== 0) {
                dx = (Math.abs(pdi - ndi) / sumDI) * 100;
            }
        }
        pdiValues.push(pdi);
        ndiValues.push(ndi);
        dxValues.push(dx);
    }

    if (dxValues.length < period) return []; 

    const adxLine = wildersSmoothing(dxValues, period);
    const adxOutput = [];
    
    // Align output
    // First adxLine value uses dxValues[0]...dxValues[period-1]. Timestamp is of dxValues[period-1].
    // dxValues[period-1] uses smoothedTR/PDM/NDM up to their index [period-1].
    // smoothedTR[period-1] uses trValues up to its index [period-1 + period-1] = [2*period-2].
    // trValues[2*period-2] comes from data[2*period-2 + 1] = data[2*period-1].
    // So, the first adxOutput point corresponds to data[2*period-1].
    // k here is index for adxLine.
    for (let k = 0; k < adxLine.length; k++) {
        // The k-th ADX value corresponds to the (k + period - 1)-th PDI/NDI value.
        const pdiNdiIndex = k + period - 1; 
        // The timestamp for this PDI/NDI value (and thus for this ADX value)
        // corresponds to the original data point at index:
        // (pdiNdiIndex for dxValues) + (period for initial TR values) = (k + period -1) + period = k + 2*period -1
        const outputDataIndex = k + (2 * period - 1);

        if (outputDataIndex < data.length) { // Ensure we don't go out of bounds for data's timestamp
             adxOutput.push({
                timestamp: data[outputDataIndex].timestamp,
                values: {
                    adx: adxLine[k],
                    pdi: pdiValues[pdiNdiIndex],
                    ndi: ndiValues[pdiNdiIndex],
                },
            });
        }
    }
    return adxOutput;
}

module.exports = { calculateADX }; // Removed wildersSmoothing export as it's now from utils

console.log("ADX function defined in financial-indicators/lib/indicators/adx.js");
