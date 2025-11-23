import { Visualizer, settings } from './base.js';

export class RadialBarsVisualizer extends Visualizer {
    constructor() {
        super('Radial Bars');
        this.settings = { 
            barCount: 64, 
            rotation: 0,
            freqStart: 0,
            freqEnd: 100
        };
    }

    getCustomSettings() {
        return [
            { key: 'barCount', label: 'Bar Count', type: 'range', min: 32, max: 128, step: 1, value: this.settings.barCount },
            { key: 'rotation', label: 'Rotation', type: 'range', min: 0, max: 360, step: 1, value: this.settings.rotation },
            { key: 'freqStart', label: 'Frequency Start %', type: 'range', min: 0, max: 100, step: 1, value: this.settings.freqStart },
            { key: 'freqEnd', label: 'Frequency End %', type: 'range', min: 0, max: 100, step: 1, value: this.settings.freqEnd }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        
        // Ensure start is always less than end
        if (key === 'freqStart' && value >= this.settings.freqEnd) {
            this.settings.freqEnd = Math.min(100, value + 1);
        }
        if (key === 'freqEnd' && value <= this.settings.freqStart) {
            this.settings.freqStart = Math.max(0, value - 1);
        }
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.3;

        // Draw main radial bars
        this.drawRadialBars(centerX, centerY, radius, 1);

        // Mirror effect - draw inverted bars
        if (settings.mirrorEffect) {
            this.ctx.globalAlpha = 0.5;
            // Draw bars going inward instead of outward
            this.drawRadialBarsInverted(centerX, centerY, radius);
            this.ctx.globalAlpha = 1;
        }
    }

    drawRadialBars(centerX, centerY, radius, alpha) {
        const barCount = this.settings.barCount;
        this.ctx.globalAlpha = alpha;

        // Calculate frequency range to use
        const freqStart = Math.floor((this.settings.freqStart / 100) * this.frequencyData.length);
        const freqEnd = Math.floor((this.settings.freqEnd / 100) * this.frequencyData.length);
        const freqRange = freqEnd - freqStart;

        if (freqRange <= 0) return;

        for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2 + (this.settings.rotation * Math.PI / 180);
            
            // Map bar to frequency range
            const freqIndex = freqStart + Math.floor((i / barCount) * freqRange);
            const barHeight = (this.frequencyData[freqIndex] / 255) * radius * settings.sensitivity;

            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);

            this.ctx.strokeStyle = settings.primaryColor;
            this.ctx.lineWidth = settings.lineWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
    }

    drawRadialBarsInverted(centerX, centerY, radius) {
        const barCount = this.settings.barCount;

        // Calculate frequency range to use
        const freqStart = Math.floor((this.settings.freqStart / 100) * this.frequencyData.length);
        const freqEnd = Math.floor((this.settings.freqEnd / 100) * this.frequencyData.length);
        const freqRange = freqEnd - freqStart;

        if (freqRange <= 0) return;

        for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2 + (this.settings.rotation * Math.PI / 180);
            
            // Map bar to frequency range
            const freqIndex = freqStart + Math.floor((i / barCount) * freqRange);
            const barHeight = (this.frequencyData[freqIndex] / 255) * radius * settings.sensitivity;

            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius - barHeight * 0.7);
            const y2 = centerY + Math.sin(angle) * (radius - barHeight * 0.7);

            this.ctx.strokeStyle = settings.primaryColor;
            this.ctx.lineWidth = settings.lineWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }
}




