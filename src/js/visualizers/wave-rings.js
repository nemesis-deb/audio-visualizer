import { Visualizer, settings } from './base.js';

export class WaveRingsVisualizer extends Visualizer {
    constructor() {
        super('Wave Rings');
        this.settings = { ringCount: 5, ringSpacing: 30 };
    }

    getCustomSettings() {
        return [
            { key: 'ringCount', label: 'Ring Count', type: 'range', min: 3, max: 10, value: 5 },
            { key: 'ringSpacing', label: 'Ring Spacing', type: 'range', min: 20, max: 60, value: 30 }
        ];
    }

    update(timeDomainData, frequencyData) {
        this.timeDomainData = timeDomainData;
    }

    draw() {
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Draw main rings
        this.drawRings(centerX, centerY, 1, false);

        // Mirror effect - draw inverted amplitude rings
        if (settings.mirrorEffect) {
            this.ctx.globalAlpha = 0.5;
            this.drawRings(centerX, centerY, 0.6, true);
            this.ctx.globalAlpha = 1;
        }
    }

    drawRings(centerX, centerY, amplitudeScale, inverted) {
        for (let ring = 0; ring < this.settings.ringCount; ring++) {
            const baseRadius = (ring + 1) * this.settings.ringSpacing;

            this.ctx.strokeStyle = settings.primaryColor;
            this.ctx.lineWidth = settings.lineWidth;
            this.ctx.globalAlpha = (1 - (ring / this.settings.ringCount) * 0.5) * (inverted ? 0.5 : 1);
            this.ctx.beginPath();

            const points = 100;
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const dataIndex = Math.floor((i / points) * this.timeDomainData.length);
                let amplitude = ((this.timeDomainData[dataIndex] / 255) - 0.5) * 50 * settings.sensitivity * amplitudeScale;

                // Invert amplitude for mirror effect
                if (inverted) {
                    amplitude = -amplitude;
                }

                const radius = baseRadius + amplitude;

                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }

            this.ctx.closePath();
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
    }
}




