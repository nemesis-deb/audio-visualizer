import { defineStore } from 'pinia';

export const useVisualizerStore = defineStore('visualizer', {
  state: () => ({
    currentVisualizer: null,
    visualizerName: 'Spectra',
    canvas: null,
    canvasContext: null,
    
    // Visualizer settings (will be populated by visualizer)
    settings: {}
  }),

  actions: {
    setCurrentVisualizer(visualizer) {
      this.currentVisualizer = visualizer;
      if (visualizer) {
        this.visualizerName = visualizer.name || 'Unknown';
      }
    },
    
    setCanvas(canvas) {
      this.canvas = canvas;
    },
    
    setCanvasContext(ctx) {
      this.canvasContext = ctx;
    },
    
    updateSetting(key, value) {
      this.settings[key] = value;
      if (this.currentVisualizer && this.currentVisualizer.updateSetting) {
        this.currentVisualizer.updateSetting(key, value);
      }
    },
    
    setSettings(settings) {
      this.settings = { ...settings };
    }
  }
});

