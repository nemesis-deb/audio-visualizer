import { Visualizer, settings } from './base.js';
import * as THREE from '../../../node_modules/three/build/three.module.js';

// Kaleidoscope Visualizer - WebGL version for GPU acceleration
export class KaleidoscopeVisualizer extends Visualizer {
    constructor() {
        super('Kaleidoscope');
        this.settings = {
            segments: 8,
            complexity: 3,
            rotationSpeed: 1.0,
            particleSize: 1.0,
            depth: 2.0,
            spread: 8.0,
            pulseIntensity: 1.0,
            particleShape: 'sphere',
            bloomIntensity: 0.5,
            trailLength: 0
        };
        this.rotation = 0;
        this.initialized = false;
        this.particles = [];
        this.time = 0;
    }

    init(canvas, ctx) {
        super.init(canvas, ctx);
    }

    initThreeJS() {
        if (this.initialized) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(settings.bgColor);

        this.camera = new THREE.PerspectiveCamera(60, this.canvas.width / this.canvas.height, 0.1, 1000);
        this.camera.position.z = 15;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: tempCanvas, 
            antialias: true, 
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.createKaleidoscope();

        // Add lighting for StandardMaterial
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(0, 0, 10);
        this.scene.add(pointLight);

        this.initialized = true;
    }

    createKaleidoscope() {
        this.kaleidoscopeGroup = new THREE.Group();
        this.scene.add(this.kaleidoscopeGroup);

        const color = new THREE.Color(settings.primaryColor);
        const particleCount = 50 * this.settings.complexity;

        // Create geometry based on shape setting
        let geometry;
        if (this.settings.particleShape === 'sphere') {
            geometry = new THREE.SphereGeometry(0.1, 8, 8);
        } else if (this.settings.particleShape === 'cube') {
            geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        } else if (this.settings.particleShape === 'cone') {
            geometry = new THREE.ConeGeometry(0.1, 0.2, 8);
        } else if (this.settings.particleShape === 'torus') {
            geometry = new THREE.TorusGeometry(0.08, 0.03, 8, 12);
        }

        const material = new THREE.MeshStandardMaterial({ 
            color,
            emissive: color,
            emissiveIntensity: 0.5,
            metalness: 0.3,
            roughness: 0.7
        });

        this.particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material.clone());
            
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 2 + (i / particleCount) * this.settings.spread;
            
            particle.position.x = Math.cos(angle) * radius;
            particle.position.y = Math.sin(angle) * radius;
            particle.position.z = (Math.random() - 0.5) * this.settings.depth;
            
            particle.userData = {
                baseX: particle.position.x,
                baseY: particle.position.y,
                baseZ: particle.position.z,
                angle: angle,
                radius: radius,
                freqIndex: i,
                phaseOffset: Math.random() * Math.PI * 2
            };
            
            this.kaleidoscopeGroup.add(particle);
            this.particles.push(particle);
        }

        // Create symmetrical copies
        this.symmetryGroups = [];
        for (let seg = 1; seg < this.settings.segments; seg++) {
            const group = this.kaleidoscopeGroup.clone();
            group.rotation.z = (Math.PI * 2 * seg) / this.settings.segments;
            this.scene.add(group);
            this.symmetryGroups.push(group);
        }
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
        this.rotation += 0.01 * this.settings.rotationSpeed;
        this.time += 0.016;
    }

    draw() {
        if (!this.initialized) {
            this.initThreeJS();
        }

        this.scene.background = new THREE.Color(settings.bgColor);

        // Calculate average frequency
        let sum = 0;
        for (let i = 0; i < 32; i++) sum += this.frequencyData[i];
        const avgFreq = sum / 32 / 255;

        // Rotate main group
        this.kaleidoscopeGroup.rotation.z = this.rotation;

        // Base color
        const baseColor = new THREE.Color(settings.primaryColor);

        // Update particles
        this.particles.forEach((particle, i) => {
            const freqIndex = Math.floor((i / this.particles.length) * this.frequencyData.length);
            const intensity = this.frequencyData[freqIndex] / 255;
            
            // Scale based on audio with pulse
            const pulse = Math.sin(this.time * 2 + particle.userData.phaseOffset) * 0.2 + 1;
            const scale = this.settings.particleSize * (0.5 + intensity * 1.5 * settings.sensitivity * this.settings.pulseIntensity) * pulse;
            particle.scale.setScalar(scale);
            
            // Update color with bloom effect
            particle.material.color = baseColor;
            particle.material.emissive = baseColor;
            particle.material.emissiveIntensity = intensity * (0.5 + this.settings.bloomIntensity);
            
            // Position animation with pulse
            const offset = intensity * 0.5 * this.settings.pulseIntensity;
            particle.position.x = particle.userData.baseX * (1 + offset);
            particle.position.y = particle.userData.baseY * (1 + offset);
            
            // Z-axis wave motion
            particle.position.z = particle.userData.baseZ + Math.sin(this.time + particle.userData.angle * 2) * 0.5 * intensity;
            
            // Rotation for non-sphere shapes
            if (this.settings.particleShape !== 'sphere') {
                particle.rotation.x = this.time + particle.userData.angle;
                particle.rotation.y = this.time * 0.5 + particle.userData.phaseOffset;
            }
        });

        // Update symmetry groups
        this.symmetryGroups.forEach((group, i) => {
            group.rotation.z = (Math.PI * 2 * (i + 1)) / this.settings.segments + this.rotation;
            
            // Update colors and transforms for all particles in symmetry groups
            group.children.forEach((particle, j) => {
                if (this.particles[j]) {
                    particle.scale.copy(this.particles[j].scale);
                    particle.material.color.copy(this.particles[j].material.color);
                    particle.material.emissive.copy(this.particles[j].material.emissive);
                    particle.material.emissiveIntensity = this.particles[j].material.emissiveIntensity;
                    particle.position.copy(this.particles[j].position);
                    if (this.settings.particleShape !== 'sphere') {
                        particle.rotation.copy(this.particles[j].rotation);
                    }
                }
            });
        });

        this.renderer.render(this.scene, this.camera);
        
        // Apply trail effect on 2D canvas
        if (this.settings.trailLength > 0) {
            // Fade previous frame
            const r = parseInt(settings.bgColor.slice(1, 3), 16);
            const g = parseInt(settings.bgColor.slice(3, 5), 16);
            const b = parseInt(settings.bgColor.slice(5, 7), 16);
            // Higher trail length = lower fade alpha = longer trails
            const fadeAlpha = Math.max(0.02, 1 - (this.settings.trailLength / 21));
            
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${fadeAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw new frame with additive blending
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.drawImage(this.renderer.domElement, 0, 0);
            this.ctx.globalCompositeOperation = 'source-over';
        } else {
            // No trails - just copy
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.renderer.domElement, 0, 0);
        }
    }

    getCustomSettings() {
        return [
            {
                key: 'segments',
                label: 'Segments',
                type: 'range',
                min: 4,
                max: 16,
                step: 1,
                value: this.settings.segments
            },
            {
                key: 'complexity',
                label: 'Complexity',
                type: 'range',
                min: 1,
                max: 5,
                step: 1,
                value: this.settings.complexity
            },
            {
                key: 'rotationSpeed',
                label: 'Rotation Speed',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.rotationSpeed
            },
            {
                key: 'particleSize',
                label: 'Particle Size',
                type: 'range',
                min: 0.5,
                max: 2,
                step: 0.1,
                value: this.settings.particleSize
            },
            {
                key: 'depth',
                label: 'Depth',
                type: 'range',
                min: 0,
                max: 5,
                step: 0.5,
                value: this.settings.depth
            },
            {
                key: 'spread',
                label: 'Spread',
                type: 'range',
                min: 4,
                max: 15,
                step: 0.5,
                value: this.settings.spread
            },
            {
                key: 'pulseIntensity',
                label: 'Pulse Intensity',
                type: 'range',
                min: 0,
                max: 2,
                step: 0.1,
                value: this.settings.pulseIntensity
            },
            {
                key: 'particleShape',
                label: 'Particle Shape',
                type: 'select',
                options: ['sphere', 'cube', 'cone', 'torus'],
                value: this.settings.particleShape
            },
            {
                key: 'bloomIntensity',
                label: 'Bloom Intensity',
                type: 'range',
                min: 0,
                max: 2,
                step: 0.1,
                value: this.settings.bloomIntensity
            },
            {
                key: 'trailLength',
                label: 'Trail Length',
                type: 'range',
                min: 0,
                max: 20,
                step: 1,
                value: this.settings.trailLength
            }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        
        if ((key === 'segments' || key === 'complexity' || key === 'depth' || key === 'spread' || key === 'particleShape') && this.initialized) {
            // Recreate kaleidoscope
            this.scene.remove(this.kaleidoscopeGroup);
            this.symmetryGroups.forEach(group => this.scene.remove(group));
            this.symmetryGroups = [];
            this.particles = [];
            this.createKaleidoscope();
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
