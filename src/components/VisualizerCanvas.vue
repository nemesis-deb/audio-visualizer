<template>
  <div class="canvas-container" id="canvasContainer">
    <canvas 
      ref="canvasRef" 
      id="visualizer" 
      :width="canvasWidth" 
      :height="canvasHeight"
    ></canvas>
    <button 
      @click="toggleFullscreen" 
      class="fullscreen-btn" 
      title="Toggle Fullscreen"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path
          d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useVisualizer } from '../composables/useVisualizer.js';
import { useSettingsStore } from '../stores/settings.js';
import { useVisualizerStore } from '../stores/visualizer.js';
import { useUIStore } from '../stores/ui.js';

const settingsStore = useSettingsStore();
const visualizerStore = useVisualizerStore();
const uiStore = useUIStore();

const canvasRef = ref(null);
const ctxRef = ref(null);
const canvasWidth = ref(1200);
const canvasHeight = ref(600);

const { start, stop, setFpsCap } = useVisualizer(canvasRef, ctxRef);

let analyserCheckInterval = null;
let fullscreenHandler = null;

// Initialize canvas
onMounted(async () => {
  await nextTick();
  
  if (canvasRef.value) {
    // Get or create canvas context
    ctxRef.value = canvasRef.value.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
      colorSpace: 'srgb'
    });
    
    // Enable image smoothing
    ctxRef.value.imageSmoothingEnabled = true;
    ctxRef.value.imageSmoothingQuality = 'high';
    
    // Set canvas in store
    visualizerStore.setCanvas(canvasRef.value);
    visualizerStore.setCanvasContext(ctxRef.value);
    
    // Make canvas available globally for compatibility
    window.visualizerCanvas = canvasRef.value;
    
    // Initialize visualizers if manager exists
    if (window.visualizerManager && canvasRef.value && ctxRef.value) {
      window.visualizerManager.visualizers.forEach(viz => {
        if (viz.init) {
          viz.init(canvasRef.value, ctxRef.value);
        }
      });
      
      // Set default visualizer
      if (!window.visualizerManager.currentVisualizer) {
        window.visualizerManager.setActive('Spectra');
      }
    }
    
    // Start animation loop when analyser is available
    const startAnimation = () => {
      if (window.analyser) {
        start(window.analyser);
      }
    };
    
    startAnimation();
    
    // Watch for analyser changes
    analyserCheckInterval = setInterval(() => {
      if (window.analyser) {
        startAnimation();
      }
    }, 1000);
  }
  
  // Handle fullscreen changes
  fullscreenHandler = () => {
    uiStore.setFullscreen(!!document.fullscreenElement);
  };
  
  document.addEventListener('fullscreenchange', fullscreenHandler);
});

// Watch for canvas resolution changes
watch(() => settingsStore.canvasResolution, (newResolution) => {
  if (newResolution && newResolution !== 'custom' && canvasRef.value) {
    const [width, height] = newResolution.split('x').map(Number);
    canvasWidth.value = width;
    canvasHeight.value = height;
    canvasRef.value.width = width;
    canvasRef.value.height = height;
    
    // Reinitialize visualizers
    if (window.visualizerManager && ctxRef.value) {
      window.visualizerManager.visualizers.forEach(viz => {
        if (viz.init) {
          viz.init(canvasRef.value, ctxRef.value);
        }
      });
      
      const current = window.visualizerManager.getCurrent();
      if (current && current.resize) {
        current.resize();
      }
    }
  }
});

// Watch for FPS cap changes
watch(() => settingsStore.fpsCap, (newFpsCap) => {
  setFpsCap(newFpsCap);
});

// Watch for custom resolution
watch(() => [settingsStore.customCanvasWidth, settingsStore.customCanvasHeight], ([width, height]) => {
  if (settingsStore.canvasResolution === 'custom' && canvasRef.value && width && height) {
    canvasWidth.value = width;
    canvasHeight.value = height;
    canvasRef.value.width = width;
    canvasRef.value.height = height;
    
    // Reinitialize visualizers
    if (window.visualizerManager && ctxRef.value) {
      window.visualizerManager.visualizers.forEach(viz => {
        if (viz.init) {
          viz.init(canvasRef.value, ctxRef.value);
        }
      });
      
      const current = window.visualizerManager.getCurrent();
      if (current && current.resize) {
        current.resize();
      }
    }
  }
});

const toggleFullscreen = () => {
  if (!canvasRef.value) return;
  
  const container = canvasRef.value.closest('.canvas-container');
  if (!container) return;
  
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => {
      console.error('Error attempting to enable fullscreen:', err);
    });
    uiStore.setFullscreen(true);
  } else {
    document.exitFullscreen();
    uiStore.setFullscreen(false);
  }
};

onUnmounted(() => {
  stop();
  
  if (analyserCheckInterval) {
    clearInterval(analyserCheckInterval);
    analyserCheckInterval = null;
  }
  
  if (fullscreenHandler) {
    document.removeEventListener('fullscreenchange', fullscreenHandler);
    fullscreenHandler = null;
  }
});
</script>

<style scoped>
/* Styles are in global styles.css */
</style>

