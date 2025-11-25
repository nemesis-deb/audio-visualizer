import { watch, onMounted } from 'vue';
import { useAudioStore } from '../stores/audio.js';
import { useVisualizerStore } from '../stores/visualizer.js';

/**
 * Integration composable to bridge Vue components with the existing audio system
 * This ensures Vue components can interact with window.audioManager and other globals
 */
export function useAudioIntegration() {
  const audioStore = useAudioStore();
  const visualizerStore = useVisualizerStore();

  const initializeIntegration = () => {
    // Make sure visualizerManager is available globally
    if (window.visualizerManager) {
      // Sync current visualizer to store
      const current = window.visualizerManager.getCurrent();
      if (current) {
        visualizerStore.setCurrentVisualizer(current);
      }
    }

    // Make audioFiles reactive by syncing to store
    if (window.audioFiles) {
      syncAudioFiles();
    }

    // Make currentFileIndex reactive
    if (typeof window.currentFileIndex === 'number') {
      audioStore.setCurrentIndex(window.currentFileIndex);
    }

    // Sync playing state
    if (typeof window.isPlaying === 'boolean') {
      audioStore.setPlaying(window.isPlaying);
    }

    // Set up watchers to keep Vue store in sync with global state
    setupWatchers();
  };

  const syncAudioFiles = () => {
    if (window.audioFiles && Array.isArray(window.audioFiles)) {
      const queueItems = window.audioFiles.map((file, index) => ({
        name: file.name,
        path: file.path,
        title: file.title || file.name,
        artist: file.artist,
        album: file.album,
        albumArt: file.albumArt || null
      }));
      audioStore.setQueue(queueItems);
    }
  };

  const setupWatchers = () => {
    // Watch for audioFiles changes (polling since it's not reactive)
    let lastAudioFilesLength = 0;
    const checkAudioFiles = () => {
      if (window.audioFiles && window.audioFiles.length !== lastAudioFilesLength) {
        lastAudioFilesLength = window.audioFiles.length;
        syncAudioFiles();
      }
    };

    // Initial sync
    syncAudioFiles();
    
    const audioFilesInterval = setInterval(checkAudioFiles, 500);

    // Watch for currentFileIndex changes
    let lastIndex = -1;
    const checkIndex = () => {
      if (typeof window.currentFileIndex === 'number' && window.currentFileIndex !== lastIndex) {
        lastIndex = window.currentFileIndex;
        audioStore.setCurrentIndex(window.currentFileIndex);
        
        // Update current track
        if (window.audioFiles && window.audioFiles[window.currentFileIndex]) {
          const file = window.audioFiles[window.currentFileIndex];
          audioStore.setCurrentTrack({
            name: file.name,
            path: file.path,
            title: file.title || file.name,
            artist: file.artist,
            album: file.album
          });
        }
      }
    };

    const indexInterval = setInterval(checkIndex, 500);

    // Watch for playing state changes
    let lastPlaying = false;
    const checkPlaying = () => {
      if (typeof window.isPlaying === 'boolean' && window.isPlaying !== lastPlaying) {
        lastPlaying = window.isPlaying;
        audioStore.setPlaying(window.isPlaying);
      }
    };

    const playingInterval = setInterval(checkPlaying, 200);

    // Cleanup on unmount
    return () => {
      clearInterval(audioFilesInterval);
      clearInterval(indexInterval);
      clearInterval(playingInterval);
    };
  };

  // Enhance window.audioManager with Vue-aware methods
  const enhanceAudioManager = () => {
    if (!window.audioManager) return;

    const originalPlay = window.audioManager.play;
    const originalPause = window.audioManager.pause;
    const originalLoadFile = window.audioManager.loadAudioFile;

    // Wrap play to update store
    if (originalPlay) {
      window.audioManager.play = function(...args) {
        const result = originalPlay.apply(this, args);
        audioStore.setPlaying(true);
        return result;
      };
    } else {
      window.audioManager.play = function() {
        if (this.externalAudio) {
          this.externalAudio.play().catch(err => {
            console.warn('Failed to play external audio:', err);
          });
        } else if (window.audioSource && window.audioBuffer) {
          // Resume audio context if suspended
          if (window.audioContext && window.audioContext.state === 'suspended') {
            window.audioContext.resume();
          }
          // Trigger play via existing system
          if (window.playBtn) {
            window.playBtn.click();
          }
        }
        audioStore.setPlaying(true);
      };
    }

    // Wrap pause to update store
    if (originalPause) {
      window.audioManager.pause = function(...args) {
        const result = originalPause.apply(this, args);
        audioStore.setPlaying(false);
        return result;
      };
    } else {
      window.audioManager.pause = function() {
        if (this.externalAudio) {
          this.externalAudio.pause();
        } else if (window.audioSource) {
          window.audioSource.stop();
        }
        audioStore.setPlaying(false);
      };
    }

    // Wrap loadFile to update store
    if (originalLoadFile) {
      window.audioManager.loadAudioFile = function(...args) {
        const result = originalLoadFile.apply(this, args);
        if (typeof window.currentFileIndex === 'number') {
          audioStore.setCurrentIndex(window.currentFileIndex);
          syncAudioFiles();
        }
        return result;
      };
    } else {
      window.audioManager.loadAudioFile = function(index) {
        if (window.loadAudioFile) {
          window.loadAudioFile(index);
          audioStore.setCurrentIndex(index);
          syncAudioFiles();
        }
      };
    }

    // Add next/previous track methods
    window.audioManager.nextTrack = function() {
      if (window.playNextTrack) {
        window.playNextTrack();
      } else if (window.audioFiles && typeof window.currentFileIndex === 'number') {
        const nextIndex = window.currentFileIndex + 1;
        if (nextIndex < window.audioFiles.length) {
          window.audioManager.loadAudioFile(nextIndex);
          setTimeout(() => window.audioManager.play(), 100);
        }
      }
    };

    window.audioManager.previousTrack = function() {
      if (window.audioFiles && typeof window.currentFileIndex === 'number') {
        const currentTime = window.audioContext ? 
          (window.audioContext.currentTime - (window.startTime || 0)) : 0;
        
        if (currentTime > 3 && window.audioBuffer) {
          // Restart current track
          window.audioManager.loadAudioFile(window.currentFileIndex);
        } else {
          // Previous track
          const prevIndex = window.currentFileIndex > 0 ? 
            window.currentFileIndex - 1 : 
            window.audioFiles.length - 1;
          window.audioManager.loadAudioFile(prevIndex);
          setTimeout(() => window.audioManager.play(), 100);
        }
      }
    };

    // Add seek method
    window.audioManager.seekTo = function(time) {
      if (this.externalAudio) {
        this.externalAudio.currentTime = time;
      } else if (window.audioSource && window.audioBuffer) {
        // For buffer source, need to stop and recreate at new position
        if (window.audioSource) {
          try {
            window.audioSource.stop();
          } catch (e) {}
        }
        // Reload and play from new position
        if (window.loadAudioFile) {
          window.loadAudioFile(window.currentFileIndex);
          setTimeout(() => {
            if (window.audioSource && window.startTime !== undefined) {
              window.startTime = window.audioContext.currentTime - time;
            }
            window.audioManager.play();
          }, 100);
        }
      }
    };

    // Add playback rate setter
    window.audioManager.setPlaybackRate = function(rate) {
      if (this.externalAudio) {
        this.externalAudio.playbackRate = rate;
      } else if (window.audioSource) {
        window.audioSource.playbackRate.value = rate;
      }
      audioStore.setPlaybackRate(rate);
    };

    // Add gain setter
    window.audioManager.setGain = function(gainDB) {
      if (window.dbGainNode) {
        window.dbGainNode.gain.value = Math.pow(10, gainDB / 20);
        audioStore.setGain(gainDB);
        localStorage.setItem('audioGainDB', gainDB.toString());
      }
    };
  };

  onMounted(() => {
    // Wait a bit for renderer.js to initialize
    setTimeout(() => {
      enhanceAudioManager();
      initializeIntegration();
    }, 100);
  });

  return {
    initializeIntegration,
    enhanceAudioManager,
    syncAudioFiles
  };
}

