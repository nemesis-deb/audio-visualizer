import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import { VolumeHistoryVisualizer } from '../js/modules/volume-history.js';

export function useVolumeHistory(canvasId, analyser) {
  const visualizer = ref(null);
  const isRunning = ref(false);

  const start = async () => {
    await nextTick();
    if (visualizer.value && !isRunning.value) {
      visualizer.value.start();
      isRunning.value = true;
    }
  };

  const stop = () => {
    if (visualizer.value && isRunning.value) {
      visualizer.value.stop();
      isRunning.value = false;
    }
  };

  const updateAnalyser = (newAnalyser) => {
    if (visualizer.value) {
      visualizer.value.updateAnalyser(newAnalyser);
    }
  };

  const init = async () => {
    await nextTick();
    // Wait for canvas to be in DOM
    const canvas = document.getElementById(canvasId);
    if (canvas && !visualizer.value) {
      visualizer.value = new VolumeHistoryVisualizer(canvasId, analyser);
      if (analyser) {
        start();
      }
    }
  };

  return {
    start,
    stop,
    updateAnalyser,
    init,
    isRunning,
    visualizer
  };
}

