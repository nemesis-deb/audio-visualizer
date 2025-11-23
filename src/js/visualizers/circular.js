import { Visualizer, settings } from './base.js';

// Circular Visualizer
export class CircularVisualizer extends Visualizer {
    constructor() {
        super('Circular');
    }

    update(timeDomainData, frequencyData) {
        this.timeDomainData = timeDomainData;
    }

    draw() {
        // Clear canvas with settings background color
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 50;

        // Draw main circular waveform
        this.drawCircularWave(centerX, centerY, radius, 1);

        // Mirror effect - draw additional mirrored copies
        if (settings.mirrorEffect) {
            this.ctx.globalAlpha = 0.6;

            // Draw 4 mirrored copies for kaleidoscope effect
            this.ctx.save();
            this.ctx.translate(centerX, centerY);

            for (let i = 1; i <= 3; i++) {
                this.ctx.rotate(Math.PI / 2);
                this.ctx.scale(1, -1);
                this.drawCircularWave(0, 0, radius, 0.8 - i * 0.15);
                this.ctx.scale(1, -1);
            }

            this.ctx.restore();
            this.ctx.globalAlpha = 1;
        }
    }

    drawCircularWave(centerX, centerY, radius, alpha) {
        this.ctx.strokeStyle = settings.primaryColor;
        this.ctx.lineWidth = settings.lineWidth;
        this.ctx.globalAlpha = alpha;
        this.ctx.beginPath();

        const sliceAngle = (Math.PI * 2) / this.timeDomainData.length;

        for (let i = 0; i < this.timeDomainData.length; i++) {
            const v = this.timeDomainData[i] / 255.0;
            const amplitude = (v - 0.5) * 100 * settings.sensitivity;
            const r = radius + amplitude;

            const angle = sliceAngle * i;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
}



