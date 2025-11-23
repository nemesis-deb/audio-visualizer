import { Visualizer, settings } from './base.js';
import * as THREE from '../../../node_modules/three/build/three.module.js';

// DNA Helix Visualizer - 3D rotating double helix
export class DnaHelixVisualizer extends Visualizer {
    constructor() {
        super('DNA Helix');
        this.settings = {
            helixSpeed: 1.0,
            helixHeight: 4.0
        };
        this.rotation = 0;
        this.initialized = false;
    }

    init(canvas, ctx) {
        super.init(canvas, ctx);
    }

    initThreeJS() {
        if (this.initialized) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(settings.bgColor);

        this.camera = new THREE.PerspectiveCamera(60, this.canvas.width / this.canvas.height, 0.1, 1000);
        this.camera.position.set(0, 0, 8);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        this.renderer = new THREE.WebGLRenderer({ canvas: tempCanvas, antialias: true, alpha: false });
        this.renderer.setSize(this.canvas.width, this.canvas.height);

        this.createHelix();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        this.initialized = true;
    }

    createHelix() {
        this.helixGroup = new THREE.Group();
        this.scene.add(this.helixGroup);

        const color = new THREE.Color(settings.primaryColor);
        const segments = 64;
        const radius = 1.5;

        this.spheres = [];

        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 4;
            const y = (t - 0.5) * this.settings.helixHeight;

            // First strand
            const x1 = Math.cos(angle) * radius;
            const z1 = Math.sin(angle) * radius;
            
            const sphere1 = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 })
            );
            sphere1.position.set(x1, y, z1);
            this.helixGroup.add(sphere1);
            this.spheres.push(sphere1);

            // Second strand (opposite)
            const x2 = Math.cos(angle + Math.PI) * radius;
            const z2 = Math.sin(angle + Math.PI) * radius;
            
            const sphere2 = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 })
            );
            sphere2.position.set(x2, y, z2);
            this.helixGroup.add(sphere2);
            this.spheres.push(sphere2);

            // Connecting bar
            if (i % 4 === 0) {
                const barGeometry = new THREE.CylinderGeometry(0.05, 0.05, radius * 2, 8);
                const bar = new THREE.Mesh(barGeometry, new THREE.MeshStandardMaterial({ color }));
                bar.position.set(0, y, 0);
                bar.rotation.z = Math.PI / 2;
                bar.rotation.y = angle;
                this.helixGroup.add(bar);
            }
        }
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
        this.rotation += 0.01 * this.settings.helixSpeed;
    }

    draw() {
        if (!this.initialized) {
            this.initThreeJS();
        }

        this.scene.background = new THREE.Color(settings.bgColor);

        let sum = 0;
        for (let i = 0; i < 32; i++) sum += this.frequencyData[i];
        const avgFreq = sum / 32 / 255;

        this.helixGroup.rotation.y = this.rotation;

        const color = new THREE.Color(settings.primaryColor);
        this.spheres.forEach((sphere, i) => {
            const freqIndex = Math.floor((i / this.spheres.length) * this.frequencyData.length);
            const intensity = this.frequencyData[freqIndex] / 255;
            
            sphere.material.color = color;
            sphere.material.emissive = color;
            sphere.material.emissiveIntensity = 0.5 + intensity * 0.5;
            sphere.scale.setScalar(1 + intensity * 0.5);
        });

        this.renderer.render(this.scene, this.camera);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.renderer.domElement, 0, 0);
    }

    getCustomSettings() {
        return [
            {
                key: 'helixSpeed',
                label: 'Rotation Speed',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.helixSpeed
            },
            {
                key: 'helixHeight',
                label: 'Helix Height',
                type: 'range',
                min: 2,
                max: 8,
                step: 0.5,
                value: this.settings.helixHeight
            }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        if (key === 'helixHeight' && this.initialized) {
            this.helixGroup.clear();
            this.createHelix();
        }
    }
}
