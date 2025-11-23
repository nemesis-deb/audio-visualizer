import { Visualizer, settings } from './base.js';

export class OscilloscopeVisualizer extends Visualizer {
    constructor() {
        super('Oscilloscope');
        this.settings = { gridLines: true, thickness: 2 };
    }

    getCustomSettings() {
        return [
            { key: 'gridLines', label: 'Grid Lines', type: 'checkbox', value: true },
            { key: 'thickness', label: 'Line Thickness', type: 'range', min: 1, max: 5, value: 2 }
        ];
    }

    update(timeDomainData, frequencyData) {
        this.timeDomainData = timeDomainData;
    }

    draw() {
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        if (this.settings.gridLines) {
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;

            // Horizontal lines
            for (let i = 0; i <= 4; i++) {
                const y = (this.canvas.height / 4) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }

            // Vertical lines
            for (let i = 0; i <= 8; i++) {
                const x = (this.canvas.width / 8) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
        }

        // Draw waveform
        this.ctx.strokeStyle = settings.primaryColor;
        this.ctx.lineWidth = this.settings.thickness;
        this.ctx.beginPath();

        const sliceWidth = this.canvas.width / this.timeDomainData.length;
        let x = 0;

        for (let i = 0; i < this.timeDomainData.length; i++) {
            const v = this.timeDomainData[i] / 255.0;
            const y = v * this.canvas.height;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.stroke();
    }
}




