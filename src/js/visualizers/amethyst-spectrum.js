import { Visualizer, settings } from './base.js';
import * as THREE from '../../../node_modules/three/build/three.module.js';

// Amethyst-style Spectrum Analyzer - Exact implementation from Amethyst
// Based on: https://github.com/Geoxor/Amethyst
const VISUALIZER_BIN_COUNT = 960;

// Helper function: normalize 8-bit value (0-255) to 0-1 (exact from Amethyst)
function normalize8bit(value) {
    return Math.max(0, Math.min(255, value)) / 255;
}

// Helper function: logParabolicSpectrum with parabolic interpolation (exact from Amethyst)
function logParabolicSpectrum(dataArray, outputLength) {
    const maxIndex = dataArray.length - 1;
    const result = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
        // logarithmic virtual index (exact from Amethyst)
        const logIndex = Math.pow(maxIndex, i / (outputLength - 1));

        // floor to get base index, get fraction for interpolation
        const base = Math.floor(logIndex);
        const t = logIndex - base;

        // get 3 y values for interpolation
        const y0 = dataArray[Math.max(base - 1, 0)];
        const y1 = dataArray[base];
        const y2 = dataArray[Math.min(base + 1, maxIndex)];

        // parabolic interpolation
        const a = (y0 - 2 * y1 + y2) / 2;
        const b = (y2 - y0) / 2;
        const c = y1;

        const y = a * t * t + b * t + c;

        result[i] = y / 255;
    }

    return result;
}

export class AmethystSpectrumVisualizer extends Visualizer {
    constructor() {
        super('Amethyst Spectrum');
        this.settings = {
            lineThickness: 0.02,
            fillOpacity: 0.3,
            opacityFalloff: 2.0,
            maxDecibels: 0,
            minDecibels: -128
        };
        this.initialized = false;
        this.analyser = null;
    }

    init(canvas, ctx) {
        super.init(canvas, ctx);
        
        // Use existing analyser and configure it like Amethyst does
        if (window.analyser) {
            this.analyser = window.analyser;
            // Set dB range to prevent bass from roofing (like Amethyst)
            this.analyser.maxDecibels = this.settings.maxDecibels;
            this.analyser.minDecibels = this.settings.minDecibels;
        }
    }

    initThreeJS() {
        if (this.initialized) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: tempCanvas, 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(this.canvas.width, this.canvas.height);

        this.createShaderMaterial();
        this.createGeometry();

        this.initialized = true;
    }

    createShaderMaterial() {
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;

        // Exact shader from Amethyst's SpectrumShader.ts
        const fragmentShader = `
            precision highp float;

            uniform vec2 u_resolution;
            uniform float[${VISUALIZER_BIN_COUNT}] u_amplitudes;
            uniform vec3 u_color;
            uniform float u_fill_opacity;
            uniform float u_line_thickness;
            uniform float u_opacity_falloff;
            varying vec2 vUv;
            
            float interpolate(float a, float b, float t) {
                return (1.0 - t) * a + t * b;
            }

            void main(){
                vec2 uv = gl_FragCoord.xy / u_resolution;
                int i = int(uv.x * float(${VISUALIZER_BIN_COUNT}));

                // fixes: https://github.com/Geoxor/Amethyst/issues/827
                int left_i = max(int((uv.x - 1.0 / u_resolution.x) * float(${VISUALIZER_BIN_COUNT})), 0);
                int right_i = min(int((uv.x + 1.0 / u_resolution.x) * float(${VISUALIZER_BIN_COUNT})), ${VISUALIZER_BIN_COUNT} - 1);

                float amplitude = u_amplitudes[i];
                float left = u_amplitudes[left_i];
                float right = u_amplitudes[right_i];
                float lowest = min(left, right);
                float dist = (amplitude - uv.y) * u_resolution.y;

                float a = 0.0;
                
                a += float(abs(dist) <= u_resolution.x * 0.005 * u_line_thickness || (uv.y >= lowest && uv.y <= amplitude)) * clamp(sign(dist), 0.0, 1.0);
                a += clamp(sign(amplitude - uv.y), 0.0, 1.0) * interpolate(1.0, u_fill_opacity, pow(1.0 - uv.y, 1.0 - u_opacity_falloff));
                a = clamp(a, 0.0, 1.0);
                gl_FragColor = vec4(u_color * a, a);
            }
        `;

        // Get color from settings and normalize (like Amethyst)
        const color = new THREE.Color(settings.primaryColor || '#5eb3f6');
        const normalizedColor = new THREE.Vector3(
            normalize8bit(color.r * 255),
            normalize8bit(color.g * 255),
            normalize8bit(color.b * 255)
        );

        this.uniforms = {
            u_resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
            u_color: { value: normalizedColor },
            u_amplitudes: { value: new Float32Array(VISUALIZER_BIN_COUNT) },
            u_fill_opacity: { value: this.settings.fillOpacity },
            u_line_thickness: { value: this.settings.lineThickness },
            u_opacity_falloff: { value: this.settings.opacityFalloff }
        };

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true
        });
    }

    createGeometry() {
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.mesh);
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
        
        // Update analyser dB settings if changed
        if (this.analyser) {
            this.analyser.maxDecibels = this.settings.maxDecibels;
            this.analyser.minDecibels = this.settings.minDecibels;
        }
    }

    draw() {
        if (!this.frequencyData) return;

        if (!this.initialized) {
            this.initThreeJS();
        }

        // Update resolution if canvas size changed
        if (this.uniforms.u_resolution.value.x !== this.canvas.width || 
            this.uniforms.u_resolution.value.y !== this.canvas.height) {
            this.uniforms.u_resolution.value.set(this.canvas.width, this.canvas.height);
            this.renderer.setSize(this.canvas.width, this.canvas.height);
        }

        // Clear canvas with background color
        this.ctx.fillStyle = settings.bgColor || '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Update color from settings (normalized like Amethyst)
        const color = new THREE.Color(settings.primaryColor || '#5eb3f6');
        this.uniforms.u_color.value.set(
            normalize8bit(color.r * 255),
            normalize8bit(color.g * 255),
            normalize8bit(color.b * 255)
        );

        // Get frequency data using analyser's getByteFrequencyData (like Amethyst)
        // This automatically respects maxDecibels/minDecibels settings
        let spectrum;
        if (this.analyser) {
            // Use analyser's getByteFrequencyData which respects maxDecibels/minDecibels
            spectrum = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(spectrum);
        } else if (this.frequencyData instanceof Uint8Array) {
            // Fallback: use provided frequencyData
            spectrum = this.frequencyData;
        } else {
            // Convert to Uint8Array
            spectrum = new Uint8Array(this.frequencyData.length);
            for (let i = 0; i < this.frequencyData.length; i++) {
                spectrum[i] = Math.min(255, Math.max(0, Math.round(this.frequencyData[i])));
            }
        }

        // Process spectrum using logParabolicSpectrum (exact Amethyst implementation)
        const processedSpectrum = logParabolicSpectrum(spectrum, VISUALIZER_BIN_COUNT);
        this.uniforms.u_amplitudes.value = processedSpectrum;

        // Update other uniforms
        this.uniforms.u_fill_opacity.value = this.settings.fillOpacity * (settings.sensitivity || 1.0);
        this.uniforms.u_line_thickness.value = this.settings.lineThickness;
        this.uniforms.u_opacity_falloff.value = this.settings.opacityFalloff;

        // Render
        this.renderer.render(this.scene, this.camera);
        this.ctx.drawImage(this.renderer.domElement, 0, 0);
    }

    getCustomSettings() {
        return [
            {
                key: 'lineThickness',
                label: 'Line Thickness',
                type: 'range',
                min: 0.005,
                max: 0.1,
                step: 0.005,
                value: this.settings.lineThickness
            },
            {
                key: 'fillOpacity',
                label: 'Fill Opacity',
                type: 'range',
                min: 0,
                max: 1,
                step: 0.05,
                value: this.settings.fillOpacity
            },
            {
                key: 'opacityFalloff',
                label: 'Opacity Falloff',
                type: 'range',
                min: 0.5,
                max: 4,
                step: 0.1,
                value: this.settings.opacityFalloff
            },
            {
                key: 'maxDecibels',
                label: 'Max Decibels',
                type: 'range',
                min: -20,
                max: 0,
                step: 1,
                value: this.settings.maxDecibels
            },
            {
                key: 'minDecibels',
                label: 'Min Decibels',
                type: 'range',
                min: -128,
                max: -60,
                step: 1,
                value: this.settings.minDecibels
            }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        
        // Update analyser if dB settings changed
        if ((key === 'maxDecibels' || key === 'minDecibels') && this.analyser) {
            this.analyser.maxDecibels = this.settings.maxDecibels;
            this.analyser.minDecibels = this.settings.minDecibels;
        }
    }
}
