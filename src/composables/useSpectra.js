/**
 * Vue composable for accessing Spectra app
 * Provides reactive access to Spectra's core functionality
 */
import { ref, computed, onMounted, watch } from 'vue';

export function useSpectra() {
  const isReady = ref(false);
  const audioFiles = ref([]);
  const currentFolder = ref('');
  const currentFileIndex = ref(-1);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(1.0);
  const playbackRate = ref(1.0);

  // Wait for Spectra to be available
  const waitForSpectra = async (maxAttempts = 20, delay = 100) => {
    for (let i = 0; i < maxAttempts; i++) {
      if (window.spectra && window.spectra.isInitialized) {
        isReady.value = true;
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
  };

  // Initialize
  onMounted(async () => {
    await waitForSpectra();
    
    if (isReady.value) {
      // Set up event listeners
      window.addEventListener('audio-file-loaded', (event) => {
        const { file, index, duration: dur } = event.detail;
        currentFileIndex.value = index;
        duration.value = dur;
        currentTime.value = 0;
      });

      window.addEventListener('audio-play', () => {
        isPlaying.value = true;
      });

      window.addEventListener('audio-pause', () => {
        isPlaying.value = false;
      });

      window.addEventListener('audio-stop', () => {
        isPlaying.value = false;
        currentTime.value = 0;
      });

      window.addEventListener('folder-loaded', (event) => {
        const { files, folderPath } = event.detail;
        audioFiles.value = files;
        currentFolder.value = folderPath;
      });

      window.addEventListener('audio-volume-change', (event) => {
        volume.value = event.detail.volume;
      });

      // Sync initial state
      if (window.audioFiles) {
        audioFiles.value = window.audioFiles;
      }
      if (window.currentFolder) {
        currentFolder.value = window.currentFolder;
      }
      if (window.currentFileIndex !== undefined) {
        currentFileIndex.value = window.currentFileIndex;
      }
    }
  });

  // Methods
  const loadFile = async (index) => {
    if (!isReady.value || !window.spectra) {
      throw new Error('Spectra not ready');
    }
    return await window.spectra.loadFile(index);
  };

  const play = () => {
    if (!isReady.value || !window.spectra) return false;
    return window.spectra.play();
  };

  const pause = () => {
    if (!isReady.value || !window.spectra) return false;
    return window.spectra.pause();
  };

  const stop = () => {
    if (!isReady.value || !window.spectra) return false;
    return window.spectra.stop();
  };

  const setVolume = (vol) => {
    if (!isReady.value || !window.spectra) return;
    window.spectra.setVolume(vol);
  };

  const setPlaybackRate = (rate) => {
    if (!isReady.value || !window.spectra) return;
    window.spectra.setPlaybackRate(rate);
  };

  const loadFolder = (folderPath) => {
    if (!isReady.value || !window.spectra) return;
    return window.spectra.fileManager.loadFolder(folderPath);
  };

  const browseFolder = async () => {
    if (!isReady.value || !window.spectra) return;
    const result = await window.spectra.electron.openFolderDialog();
    if (result && !result.canceled && result.filePaths && result.filePaths[0]) {
      return window.spectra.fileManager.loadFolder(result.filePaths[0]);
    }
    return null;
  };

  return {
    // State
    isReady,
    audioFiles,
    currentFolder,
    currentFileIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    
    // Methods
    loadFile,
    play,
    pause,
    stop,
    setVolume,
    setPlaybackRate,
    loadFolder,
    browseFolder,
    
    // Direct access
    spectra: computed(() => window.spectra),
    fileManager: computed(() => window.spectra?.fileManager),
    audioPlayer: computed(() => window.spectra?.audioPlayer),
    electron: computed(() => window.spectra?.electron)
  };
}

