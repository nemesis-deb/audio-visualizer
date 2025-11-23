import { Visualizer, settings } from './base.js';

// Fireworks Visualizer - Explosive particle effects
export class FireworksVisualizer extends Visualizer {
    constructor() {
        super('Fireworks');
        this.settings = {
            explosionThreshold: 0.7,
            particleLife: 60
        };
        this.fireworks = [];
        this.lastBeat = 0;
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        // Fade effect
        this.ctx.fillStyle = settings.bgColor + '15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Detect beats for new fireworks
        let sum = 0;
        for (let i = 0; i < 32; i++) sum += this.frequencyData[i];
        const avgFreq = sum / 32 / 255;

        if (avgFreq > this.settings.explosionThreshold && Date.now() - this.lastBeat > 200) {
            this.createFirework();
            this.lastBeat = Date.now();
        }

        // Update and draw fireworks
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const fw = this.fireworks[i];
            fw.life--;

            if (fw.life <= 0) {
                this.fireworks.splice(i, 1);
                continue;
            }

            fw.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // Gravity
                p.vx *= 0.99; // Air resistance
                p.vy *= 0.99;

                const alpha = (fw.life / this.settings.particleLife) * 0.8;
                this.ctx.fillStyle = this.hexToRgba(settings.primaryColor, alpha);
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();

                // Trail
                this.ctx.strokeStyle = this.hexToRgba(settings.primaryColor, alpha * 0.3);
                this.ctx.lineWidth = p.size * 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
                this.ctx.lineTo(p.x, p.y);
                this.ctx.stroke();
            });
        }
    }

    createFirework() {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height * 0.6;
        const particleCount = 50 + Math.random() * 50;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 4;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 2
            });
        }

        this.fireworks.push({
            particles: particles,
            life: this.settings.particleLife
        });
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    getCustomSettings() {
        return [
            {
                key: 'explosionThreshold',
                label: 'Beat Sensitivity',
                type: 'range',
                min: 0.3,
                max: 0.9,
                step: 0.1,
                value: this.settings.explosionThreshold
            },
            {
                key: 'particleLife',
                label: 'Particle Life',
                type: 'range',
                min: 30,
                max: 120,
                step: 10,
                value: this.settings.particleLife
            }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
    }
}
