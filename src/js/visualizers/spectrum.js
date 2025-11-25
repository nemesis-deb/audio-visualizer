import { Visualizer, settings } from './base.js';
import { compressFrequencyData } from '../modules/frequency-compressor.js';

// Spectrum Analyzer Visualizer
export class SpectrumVisualizer extends Visualizer {
    constructor() {
        super('Spectrum');
        this.settings = { barGap: 2, barStyle: 'gradient' };
    }

    getCustomSettings() {
        return [
            { key: 'barGap', label: 'Bar Gap', type: 'range', min: 0, max: 10, value: 2 },
            { key: 'barStyle', label: 'Bar Style', type: 'select', options: ['solid', 'gradient', 'glow'], value: 'gradient' }
        ];
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        this.ctx.fillStyle = settings?.bgColor || '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply compression to prevent bass from "roofing"
        let compressedData;
        if (this.frequencyData instanceof Uint8Array) {
            const compressed = compressFrequencyData(this.frequencyData, {
                threshold: 0.65,
                ratio: 6.0,
                bassRange: 0.15,
                normalized: false
            });
            compressedData = new Uint8Array(compressed.length);
            for (let i = 0; i < compressed.length; i++) {
                compressedData[i] = Math.round(compressed[i] * 255);
            }
        } else {
            compressedData = this.frequencyData;
        }

        const barCount = 64;
        const barWidth = (this.canvas.width / barCount) - this.settings.barGap;

        // Get settings with defaults
        const primaryColor = settings?.primaryColor || '#00ff88';
        const bgColor = settings?.bgColor || '#000000';
        const sensitivity = settings?.sensitivity || 1.0;
        
        // Set shadow once for glow mode (more efficient)
        if (this.settings.barStyle === 'glow') {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = primaryColor;
            this.ctx.fillStyle = primaryColor;
        }

        for (let i = 0; i < barCount; i++) {
            const barHeight = (compressedData[i] / 255) * this.canvas.height * sensitivity;
            const x = i * (barWidth + this.settings.barGap);
            const y = this.canvas.height - barHeight;

            if (this.settings.barStyle === 'gradient') {
                const gradient = this.ctx.createLinearGradient(x, y, x, this.canvas.height);
                gradient.addColorStop(0, primaryColor);
                gradient.addColorStop(1, bgColor);
                this.ctx.fillStyle = gradient;
            } else if (this.settings.barStyle !== 'glow') {
                this.ctx.fillStyle = primaryColor;
            }

            this.ctx.fillRect(x, y, barWidth, barHeight);
        }
        
        // Reset shadow after glow mode
        if (this.settings.barStyle === 'glow') {
            this.ctx.shadowBlur = 0;
        }
    }
}



