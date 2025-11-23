import { Visualizer, settings } from './base.js';

// Frequency Bars Visualizer
export class FrequencyBarsVisualizer extends Visualizer {
    constructor() {
        super('Frequency Bars');
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        // Clear canvas with settings background color
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate bar width
        const barCount = 128;
        const barWidth = this.canvas.width / barCount;

        // Draw bars
        for (let i = 0; i < barCount; i++) {
            const barHeight = (this.frequencyData[i] / 255) * this.canvas.height * settings.sensitivity;

            // Color gradient based on frequency
            const hue = (i / barCount) * 360;
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

            const x = i * barWidth;
            const y = this.canvas.height - barHeight;

            this.ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
    }
}



