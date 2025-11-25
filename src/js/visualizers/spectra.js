import { Visualizer, settings } from './base.js';
import * as THREE from '../../../node_modules/three/build/three.module.js';
import { compressFrequencyData } from '../modules/frequency-compressor.js';

// Spectrum Visualizer - Audio frequency visualization with filled curve
export class SpectraVisualizer extends Visualizer {
    constructor() {
        super('Spectra');
        this.settings = {
            lineThickness: 0.02,
            fillOpacity: 0.3,
            opacityFalloff: 2.0,
            binCount: 256  // Increased for much more detail
        };
        this.initialized = false;
    }

    init(canvas, ctx) {
        super.init(canvas, ctx);
    }

    initThreeJS() {
        if (this.initialized) return;
        
        // Ensure canvas is initialized
        if (!this.canvas) {
            console.warn('[SpectraVisualizer] Canvas not initialized, cannot init Three.js');
            return;
        }

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

        const fragmentShader = `
            uniform vec3 u_color;
            uniform float u_amplitudes[256];
            uniform float u_fill_opacity;
            uniform float u_line_thickness;
            uniform float u_opacity_falloff;
            varying vec2 vUv;

            float getAmplitude(float x) {
                float index = x * 256.0;
                int i1 = int(floor(index));
                int i2 = int(ceil(index));
                float frac = fract(index);
                
                // Clamp indices
                i1 = clamp(i1, 0, 255);
                i2 = clamp(i2, 0, 255);
                
                // Interpolate between two samples
                float amp1 = u_amplitudes[i1] / 255.0;
                float amp2 = u_amplitudes[i2] / 255.0;
                return mix(amp1, amp2, frac);
            }

            void main() {
                float x = vUv.x;
                float y = vUv.y;
                
                // Calculate amplitude at this x position with interpolation
                float amp = getAmplitude(x);
                
                // Calculate waveform line position (centered, with upward amplitude)
                float waveY = 0.5 + amp * 0.4;
                float dist = abs(y - waveY);
                
                // Line rendering with anti-aliasing
                float lineAlpha = smoothstep(u_line_thickness + 0.005, u_line_thickness - 0.005, dist);
                
                // Fill rendering (below the line)
                float fillAlpha = 0.0;
                if (y < waveY) {
                    float fillDist = waveY - y;
                    float normalizedDist = fillDist / waveY;
                    fillAlpha = u_fill_opacity * pow(1.0 - normalizedDist, u_opacity_falloff);
                }
                
                float alpha = max(lineAlpha, fillAlpha);
                gl_FragColor = vec4(u_color, alpha);
            }
        `;

        this.uniforms = {
            u_color: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
            u_amplitudes: { value: new Float32Array(this.settings.binCount) },
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

    logParabolicSpectrum(spectrum, binCount) {
        const result = new Float32Array(binCount);
        const spectrumLength = spectrum.length;
        const maxIndex = spectrumLength - 1;
        
        for (let i = 0; i < binCount; i++) {
            // Enhanced distribution that spreads high frequencies more
            const normalizedPos = i / (binCount - 1);
            
            let curvedPos;
            if (normalizedPos < 0.5) {
                // Left half: use parabolic curve (compressed)
                const leftPos = normalizedPos * 2;
                curvedPos = leftPos * leftPos * 0.3;
            } else {
                // Right half: spread out to fill more space
                const rightPos = (normalizedPos - 0.5) * 2;
                curvedPos = 0.3 + (rightPos * rightPos * 0.7);
            }
            
            const logIndex = Math.pow(maxIndex, curvedPos);
            const index = Math.floor(logIndex);
            result[i] = spectrum[Math.min(index, maxIndex)];
        }
        
        return result;
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        // Ensure canvas and context are available
        if (!this.canvas || !this.ctx) {
            console.warn('[SpectraVisualizer] Canvas or context not available');
            return;
        }
        
        if (!this.initialized) {
            this.initThreeJS();
            // If initialization failed, return early
            if (!this.initialized) {
                return;
            }
        }

        // Clear canvas with background color
        this.ctx.fillStyle = settings?.bgColor || '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Update color from settings
        const primaryColor = settings?.primaryColor || '#00ff88';
        const color = new THREE.Color(primaryColor);
        this.uniforms.u_color.value.set(color.r, color.g, color.b);

        // Apply compression to prevent bass from "roofing"
        let compressedData;
        if (this.frequencyData instanceof Uint8Array) {
            const compressed = compressFrequencyData(this.frequencyData, {
                threshold: 0.65,
                ratio: 6.0,
                bassRange: 0.15,
                normalized: false
            });
            compressedData = new Uint8Array(compressed.length);
            for (let i = 0; i < compressed.length; i++) {
                compressedData[i] = Math.round(compressed[i] * 255);
            }
        } else {
            compressedData = this.frequencyData;
        }

        // Update amplitude data using logarithmic/parabolic distribution
        const processedSpectrum = this.logParabolicSpectrum(
            compressedData, 
            this.settings.binCount
        );
        this.uniforms.u_amplitudes.value = processedSpectrum;

        // Update other uniforms
        this.uniforms.u_fill_opacity.value = this.settings.fillOpacity * settings.sensitivity;
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
                max: 0.05,
                step: 0.005,
                value: this.settings.lineThickness
            },
            {
                key: 'fillOpacity',
                label: 'Fill Opacity',
                type: 'range',
                min: 0,
                max: 1,
                step: 0.1,
                value: this.settings.fillOpacity
            },
            {
                key: 'opacityFalloff',
                label: 'Opacity Falloff',
                type: 'range',
                min: 0.5,
                max: 4,
                step: 0.5,
                value: this.settings.opacityFalloff
            },
            {
                key: 'binCount',
                label: 'Frequency Bins',
                type: 'range',
                min: 64,
                max: 512,
                step: 32,
                value: this.settings.binCount
            }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        
        // If bin count changes, recreate the shader with new array size
        if (key === 'binCount' && this.initialized) {
            this.scene.remove(this.mesh);
            this.createShaderMaterial();
            this.createGeometry();
        }
    }
}