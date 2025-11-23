import { Visualizer, settings } from './base.js';

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
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const barCount = 64;
        const barWidth = (this.canvas.width / barCount) - this.settings.barGap;

        // Set shadow once for glow mode (more efficient)
        if (this.settings.barStyle === 'glow') {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = settings.primaryColor;
            this.ctx.fillStyle = settings.primaryColor;
        }

        for (let i = 0; i < barCount; i++) {
            const barHeight = (this.frequencyData[i] / 255) * this.canvas.height * settings.sensitivity;
            const x = i * (barWidth + this.settings.barGap);
            const y = this.canvas.height - barHeight;

            if (this.settings.barStyle === 'gradient') {
                const gradient = this.ctx.createLinearGradient(x, y, x, this.canvas.height);
                gradient.addColorStop(0, settings.primaryColor);
                gradient.addColorStop(1, settings.bgColor);
                this.ctx.fillStyle = gradient;
            } else if (this.settings.barStyle !== 'glow') {
                this.ctx.fillStyle = settings.primaryColor;
            }

            this.ctx.fillRect(x, y, barWidth, barHeight);
        }
        
        // Reset shadow after glow mode
        if (this.settings.barStyle === 'glow') {
            this.ctx.shadowBlur = 0;
        }
    }
}



