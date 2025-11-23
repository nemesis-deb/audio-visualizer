import { Visualizer, settings } from './base.js';

export class ParticleVisualizer extends Visualizer {
    constructor() {
        super('Particles');
        this.particles = [];
        this.settings = { particleCount: 150, speed: 1.5, trailLength: 0.15 };
    }

    getCustomSettings() {
        return [
            { key: 'particleCount', label: 'Particle Count', type: 'range', min: 50, max: 300, value: 150 },
            { key: 'speed', label: 'Speed', type: 'range', min: 0.5, max: 3, value: 1.5, step: 0.1 },
            { key: 'trailLength', label: 'Trail Length', type: 'range', min: 0.05, max: 0.5, value: 0.15, step: 0.05 }
        ];
    }

    init(canvas, ctx) {
        super.init(canvas, ctx);
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        const count = this.settings.particleCount || 150;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: Math.random() * 2 + 1,
                baseSpeed: Math.random() * 0.5 + 0.5
            });
        }
    }

    updateSetting(key, value) {
        super.updateSetting(key, value);
        if (key === 'particleCount' && this.canvas) {
            this.initParticles();
        }
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
        this.timeDomainData = timeDomainData;

        // Calculate average amplitude from frequency data (bass heavy)
        let bassSum = 0;
        let midSum = 0;
        let trebleSum = 0;

        const bassEnd = Math.floor(frequencyData.length * 0.1);
        const midEnd = Math.floor(frequencyData.length * 0.4);

        for (let i = 0; i < bassEnd; i++) {
            bassSum += frequencyData[i];
        }
        for (let i = bassEnd; i < midEnd; i++) {
            midSum += frequencyData[i];
        }
        for (let i = midEnd; i < frequencyData.length; i++) {
            trebleSum += frequencyData[i];
        }

        this.bassEnergy = (bassSum / bassEnd) / 255;
        this.midEnergy = (midSum / (midEnd - bassEnd)) / 255;
        this.trebleEnergy = (trebleSum / (frequencyData.length - midEnd)) / 255;
        this.avgAmplitude = (bassSum + midSum + trebleSum) / frequencyData.length;
    }

    draw() {
        if (!this.canvas) return;

        // Fade effect with adjustable trail length
        const bgColor = settings.bgColor;
        const rgb = parseInt(bgColor.slice(1), 16);
        const r = (rgb >> 16) & 255;
        const g = (rgb >> 8) & 255;
        const b = rgb & 255;
        const trailAlpha = this.settings.trailLength || 0.15;
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${trailAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate energy with better scaling
        const energy = Math.min((this.avgAmplitude / 128) * settings.sensitivity, 3);
        const bassBoost = this.bassEnergy * 2;

        this.particles.forEach((particle, index) => {
            // Different particles react to different frequencies
            const freqIndex = Math.floor((index / this.particles.length) * 3);
            let particleEnergy = energy;

            if (freqIndex === 0) particleEnergy *= (1 + this.bassEnergy * 2);
            else if (freqIndex === 1) particleEnergy *= (1 + this.midEnergy);
            else particleEnergy *= (1 + this.trebleEnergy);

            // Move particle with energy influence
            const speedMultiplier = this.settings.speed || 1.5;
            particle.x += particle.vx * particle.baseSpeed * speedMultiplier * (1 + particleEnergy);
            particle.y += particle.vy * particle.baseSpeed * speedMultiplier * (1 + particleEnergy);

            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Draw particle with energy-based size and color
            const particleSize = particle.size * (1 + particleEnergy * 0.5);

            // Color varies based on energy
            const primaryRgb = parseInt(settings.primaryColor.slice(1), 16);
            const pr = (primaryRgb >> 16) & 255;
            const pg = (primaryRgb >> 8) & 255;
            const pb = primaryRgb & 255;

            // Add energy-based color variation
            const colorR = Math.min(255, pr + particleEnergy * 50);
            const colorG = Math.min(255, pg + particleEnergy * 30);
            const colorB = Math.min(255, pb + particleEnergy * 20);

            this.ctx.fillStyle = `rgba(${colorR}, ${colorG}, ${colorB}, ${0.6 + particleEnergy * 0.4})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Add glow effect on high energy
            if (particleEnergy > 1) {
                this.ctx.shadowBlur = 10 * particleEnergy;
                this.ctx.shadowColor = settings.primaryColor;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });
    }
}




