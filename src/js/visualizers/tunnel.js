import { Visualizer, settings } from './base.js';
import * as THREE from '../../../node_modules/three/build/three.module.js';

// Tunnel Visualizer - 3D infinite tunnel
export class TunnelVisualizer extends Visualizer {
    constructor() {
        super('Tunnel');
        this.settings = {
            tunnelSpeed: 1.0,
            segments: 32
        };
        this.time = 0;
        this.initialized = false;
    }

    init(canvas, ctx) {
        super.init(canvas, ctx);
    }

    initThreeJS() {
        if (this.initialized) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(settings.bgColor);
        this.scene.fog = new THREE.Fog(settings.bgColor, 5, 20);

        this.camera = new THREE.PerspectiveCamera(75, this.canvas.width / this.canvas.height, 0.1, 1000);
        this.camera.position.z = 0;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        this.renderer = new THREE.WebGLRenderer({ canvas: tempCanvas, antialias: true, alpha: false });
        this.renderer.setSize(this.canvas.width, this.canvas.height);

        this.createTunnel();

        this.initialized = true;
    }

    createTunnel() {
        this.tunnelRings = [];
        const color = new THREE.Color(settings.primaryColor);

        for (let i = 0; i < 30; i++) {
            const geometry = new THREE.TorusGeometry(3, 0.1, 16, this.settings.segments);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                wireframe: true
            });
            const ring = new THREE.Mesh(geometry, material);
            ring.position.z = -i * 2;
            this.scene.add(ring);
            this.tunnelRings.push(ring);
        }
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
        this.time += 0.05 * this.settings.tunnelSpeed;
    }

    draw() {
        if (!this.initialized) {
            this.initThreeJS();
        }

        this.scene.background = new THREE.Color(settings.bgColor);
        this.scene.fog.color = new THREE.Color(settings.bgColor);

        let sum = 0;
        for (let i = 0; i < 64; i++) sum += this.frequencyData[i];
        const avgFreq = sum / 64 / 255;

        const color = new THREE.Color(settings.primaryColor);

        this.tunnelRings.forEach((ring, i) => {
            // Move rings forward
            ring.position.z += 0.1 * this.settings.tunnelSpeed * (1 + avgFreq);
            
            // Reset ring when it passes camera
            if (ring.position.z > 2) {
                ring.position.z = -58;
            }

            // Audio reactive scaling
            const freqIndex = Math.floor((i / this.tunnelRings.length) * this.frequencyData.length);
            const intensity = this.frequencyData[freqIndex] / 255;
            const scale = 1 + intensity * 0.5 * settings.sensitivity;
            ring.scale.set(scale, scale, 1);

            // Rotation
            ring.rotation.z = this.time + i * 0.1;

            // Update color
            ring.material.color = color;
        });

        this.renderer.render(this.scene, this.camera);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.renderer.domElement, 0, 0);
    }

    getCustomSettings() {
        return [
            {
                key: 'tunnelSpeed',
                label: 'Speed',
                type: 'range',
                min: 0.1,
                max: 3,
                step: 0.1,
                value: this.settings.tunnelSpeed
            },
            {
                key: 'segments',
                label: 'Ring Segments',
                type: 'range',
                min: 16,
                max: 64,
                step: 8,
                value: this.settings.segments
            }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        if (key === 'segments' && this.initialized) {
            this.tunnelRings.forEach(ring => this.scene.remove(ring));
            this.tunnelRings = [];
            this.createTunnel();
        }
    }
}
