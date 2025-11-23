import { Visualizer, settings } from './base.js';

// Waveform Visualizer
export class WaveformVisualizer extends Visualizer {
    constructor() {
        super('Waveform');
    }

    update(timeDomainData, frequencyData) {
        this.timeDomainData = timeDomainData;
    }

    draw() {
        // Clear canvas with settings background color
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set line style from settings
        this.ctx.lineWidth = settings.lineWidth;
        this.ctx.strokeStyle = settings.primaryColor;
        this.ctx.beginPath();

        // Calculate slice width
        const sliceWidth = this.canvas.width / this.timeDomainData.length;
        let x = 0;

        // Draw waveform
        for (let i = 0; i < this.timeDomainData.length; i++) {
            const v = this.timeDomainData[i] / 255.0;
            const y = v * this.canvas.height * settings.sensitivity;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.stroke();

        // Mirror effect
        if (settings.mirrorEffect) {
            this.ctx.save();
            this.ctx.scale(1, -1);
            this.ctx.translate(0, -this.canvas.height);
            this.ctx.globalAlpha = 0.5;
            this.ctx.drawImage(this.canvas, 0, 0);
            this.ctx.restore();
        }
    }
}

// ES6 export above
