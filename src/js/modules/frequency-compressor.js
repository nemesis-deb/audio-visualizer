// Frequency Compressor - Prevents bass from "roofing" (hitting maximum)
// This is a general utility for all visualizers that display frequency data

/**
 * Compresses frequency data to prevent bass frequencies from hitting the maximum
 * @param {Uint8Array|Float32Array} frequencyData - Input frequency data (0-255 or 0-1)
 * @param {Object} options - Compression options
 * @param {number} options.threshold - Threshold above which compression starts (0-1, default 0.7)
 * @param {number} options.ratio - Compression ratio (default 4:1)
 * @param {number} options.bassRange - Percentage of frequencies considered "bass" (default 0.15 = 15%)
 * @param {boolean} options.normalized - Whether input is normalized (0-1) or raw (0-255)
 * @returns {Float32Array} - Compressed frequency data (normalized 0-1)
 */
export function compressFrequencyData(frequencyData, options = {}) {
    const {
        threshold = 0.7,
        ratio = 4.0,
        bassRange = 0.15,
        normalized = false
    } = options;

    const length = frequencyData.length;
    const result = new Float32Array(length);
    
    // Determine bass frequency range (first N% of frequencies)
    const bassEnd = Math.floor(length * bassRange);
    
    // Find the maximum value in bass frequencies to detect "roofing"
    let maxBass = 0;
    for (let i = 0; i < bassEnd; i++) {
        const value = normalized ? frequencyData[i] : frequencyData[i] / 255;
        if (value > maxBass) {
            maxBass = value;
        }
    }
    
    // If bass is hitting the roof, apply dB-based compression
    if (maxBass > threshold) {
        // Calculate how much over threshold we are
        const overThreshold = maxBass - threshold;
        const compressedOver = overThreshold / ratio;
        const targetMax = threshold + compressedOver;
        
        // Calculate dB reduction needed (convert linear to dB, apply reduction, convert back)
        // dB = 20 * log10(linear)
        // linear = 10^(dB/20)
        const maxBassDB = 20 * Math.log10(maxBass + 0.0001); // Add small value to avoid log(0)
        const targetMaxDB = 20 * Math.log10(targetMax + 0.0001);
        const dbReduction = maxBassDB - targetMaxDB;
        
        // Apply dB-based compression to all frequencies, but more aggressive on bass
        for (let i = 0; i < length; i++) {
            let value = normalized ? frequencyData[i] : frequencyData[i] / 255;
            
            // Convert to dB
            const valueDB = 20 * Math.log10(value + 0.0001);
            
            // Apply compression based on frequency range
            if (i < bassEnd) {
                // Bass: apply full dB reduction
                const compressedDB = valueDB - dbReduction;
                value = Math.pow(10, compressedDB / 20);
            } else {
                // Other frequencies: apply lighter dB reduction to maintain balance
                const lightReduction = dbReduction * 0.3;
                const compressedDB = valueDB - lightReduction;
                value = Math.pow(10, compressedDB / 20);
            }
            
            result[i] = Math.min(1.0, Math.max(0.0, value));
        }
    } else {
        // No compression needed, just normalize if needed
        for (let i = 0; i < length; i++) {
            result[i] = normalized ? frequencyData[i] : frequencyData[i] / 255;
        }
    }
    
    return result;
}

/**
 * Simple limiter - just caps values at a maximum
 * @param {Uint8Array|Float32Array} frequencyData - Input frequency data
 * @param {number} maxValue - Maximum allowed value (0-1 if normalized, 0-255 if raw)
 * @param {boolean} normalized - Whether input is normalized
 * @returns {Float32Array} - Limited frequency data (normalized 0-1)
 */
export function limitFrequencyData(frequencyData, maxValue = 0.85, normalized = false) {
    const length = frequencyData.length;
    const result = new Float32Array(length);
    const max = normalized ? maxValue : maxValue / 255;
    
    for (let i = 0; i < length; i++) {
        const value = normalized ? frequencyData[i] : frequencyData[i] / 255;
        result[i] = Math.min(max, value);
    }
    
    return result;
}

