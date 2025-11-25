import { ref, onMounted, onUnmounted } from 'vue';

export function useVisualizer(canvasRef, ctxRef) {
  const isAnimating = ref(false);
  let animationFrameId = null;
  let fpsCap = null;
  let fpsCapLastFrameTime = 0;
  
  // Data arrays
  let timeDomainData = null;
  let frequencyData = null;
  let analyser = null;

  const start = (analyserNode) => {
    if (isAnimating.value) return;
    
    analyser = analyserNode;
    if (analyser) {
      const bufferLength = analyser.frequencyBinCount;
      timeDomainData = new Uint8Array(bufferLength);
      frequencyData = new Uint8Array(bufferLength);
    }
    
    isAnimating.value = true;
    animate();
  };

  const stop = () => {
    isAnimating.value = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  const setFpsCap = (fps) => {
    fpsCap = fps === 'unlimited' ? null : parseInt(fps);
  };

  const animate = () => {
    if (!isAnimating.value) return;
    
    animationFrameId = requestAnimationFrame(animate);

    // Apply FPS cap if set
    if (fpsCap !== null) {
      const now = performance.now();
      const frameInterval = 1000 / fpsCap;
      const elapsed = now - fpsCapLastFrameTime;

      if (elapsed < frameInterval) {
        return;
      }

      fpsCapLastFrameTime = now - (elapsed % frameInterval);
    }

    if (!analyser || !window.visualizerManager) return;

    // Get audio data
    analyser.getByteTimeDomainData(timeDomainData);
    analyser.getByteFrequencyData(frequencyData);

    // Update and draw current visualizer
    window.visualizerManager.update(timeDomainData, frequencyData);
    window.visualizerManager.draw();
  };

  onUnmounted(() => {
    stop();
  });

  return {
    start,
    stop,
    setFpsCap,
    isAnimating
  };
}

