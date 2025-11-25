/**
 * Amethyst-Style Spectrum Visualizer
 * Based on Amethyst's SpectrumAnalyzer with shader-like rendering
 * Uses logarithmic parabolic interpolation for smooth spectrum display
 */
import { Visualizer, settings } from './base.js';
import { logParabolicSpectrum, VISUALIZER_BIN_COUNT, normalize8bit } from '../utils/spectrumMath.js';

export class AmethystSpectrumVisualizer extends Visualizer {
  constructor() {
    super('Amethyst Spectrum');
    this.settings = {
      lineThickness: 1.0,
      fillOpacity: 0.3,
      opacityFalloff: 0.5,
      smoothing: 0.8,
      fftSize: 2048
    };
    
    // Store processed spectrum data
    this.processedSpectrum = new Float32Array(VISUALIZER_BIN_COUNT);
    this.spectrumData = null;
  }

  getCustomSettings() {
    return [
      { 
        key: 'lineThickness', 
        label: 'Line Thickness', 
        type: 'range', 
        min: 0.5, 
        max: 3.0, 
        step: 0.1,
        value: this.settings.lineThickness 
      },
      { 
        key: 'fillOpacity', 
        label: 'Fill Opacity', 
        type: 'range', 
        min: 0.0, 
        max: 1.0, 
        step: 0.05,
        value: this.settings.fillOpacity 
      },
      { 
        key: 'opacityFalloff', 
        label: 'Opacity Falloff', 
        type: 'range', 
        min: 0.0, 
        max: 1.0, 
        step: 0.05,
        value: this.settings.opacityFalloff 
      },
      { 
        key: 'smoothing', 
        label: 'Smoothing', 
        type: 'range', 
        min: 0.0, 
        max: 1.0, 
        step: 0.05,
        value: this.settings.smoothing 
      }
    ];
  }

  init(canvas, ctx) {
    super.init(canvas, ctx);
    // Initialize processed spectrum array
    this.processedSpectrum = new Float32Array(VISUALIZER_BIN_COUNT);
  }

  update(timeDomainData, frequencyData) {
    this.spectrumData = frequencyData;
    
    // Process spectrum with logarithmic parabolic interpolation
    if (frequencyData instanceof Uint8Array) {
      this.processedSpectrum = logParabolicSpectrum(frequencyData, VISUALIZER_BIN_COUNT);
    }
  }

    draw() {
        if (!this.ctx || !this.canvas || !this.processedSpectrum) return;

        const { width, height } = this.canvas;
        
        // Clear canvas
        this.ctx.fillStyle = settings?.bgColor || '#000000';
        this.ctx.fillRect(0, 0, width, height);

    if (this.processedSpectrum.length === 0) return;

        // Get primary color
        const primaryColor = settings?.primaryColor || '#00ff88';
        const colorRgb = this.hexToRgb(primaryColor);
    const normalizedColor = {
      r: normalize8bit(colorRgb.r),
      g: normalize8bit(colorRgb.g),
      b: normalize8bit(colorRgb.b)
    };

    // Draw spectrum line with fill
    this.ctx.beginPath();
    this.ctx.strokeStyle = primaryColor;
    this.ctx.lineWidth = this.settings.lineThickness * 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const pointCount = this.processedSpectrum.length;
    const stepX = width / (pointCount - 1);

    // Draw filled area
    this.ctx.beginPath();
    this.ctx.moveTo(0, height);
    
    for (let i = 0; i < pointCount; i++) {
      const x = i * stepX;
      const amplitude = this.processedSpectrum[i];
      const y = height - (amplitude * height);
      this.ctx.lineTo(x, y);
    }
    
    // Close path at bottom right
    this.ctx.lineTo(width, height);
    this.ctx.closePath();

    // Fill with gradient opacity
    const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
    const fillOpacity = this.settings.fillOpacity;
    const falloff = this.settings.opacityFalloff;
    
    gradient.addColorStop(0, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${fillOpacity})`);
    gradient.addColorStop(1, `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${fillOpacity * (1 - falloff)})`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw line on top
    this.ctx.beginPath();
    this.ctx.strokeStyle = primaryColor;
    this.ctx.lineWidth = this.settings.lineThickness * 2;
    
    for (let i = 0; i < pointCount; i++) {
      const x = i * stepX;
      const amplitude = this.processedSpectrum[i];
      const y = height - (amplitude * height);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 255, b: 136 }; // Default to green
  }
}

