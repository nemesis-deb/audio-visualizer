<template>
  <div id="app">
    <!-- SVG sprite from original index.html (keep in HTML for now) -->
    <TitleBar />
    
    <!-- Album Art Background -->
    <div id="albumArtBackground" class="album-art-background"></div>
    
    <!-- Main App Container -->
    <div class="app-container">
      <!-- File Browser (left sidebar) -->
      <FileBrowser />
      
      <div class="content-wrapper">
        <!-- Audio Player -->
        <AudioPlayer />
        
        <!-- Bottom Section: Canvas + Right Panel -->
        <div class="bottom-section">
          <!-- Canvas Container (center) -->
          <VisualizerCanvas />
          
          <!-- Visualizer Panel (right side) -->
          <VisualizerPanel />
        </div>
      </div>
    </div>
    
    <!-- Settings Panel -->
    <SettingsPanel />
    
    <!-- Queue Panel -->
    <QueuePanel />
    
    <!-- Spotify Panel (will be integrated into sidebar in Phase 5) -->
    <SpotifyPanel />
    
    <!-- YouTube Panel (will be integrated into sidebar in Phase 5) -->
    <YouTubePanel />
  </div>
</template>

<script setup>
import TitleBar from './components/TitleBar.vue';
import AudioPlayer from './components/AudioPlayer.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import VisualizerCanvas from './components/VisualizerCanvas.vue';
import VisualizerPanel from './components/VisualizerPanel.vue';
import QueuePanel from './components/QueuePanel.vue';
import SpotifyPanel from './components/SpotifyPanel.vue';
import YouTubePanel from './components/YouTubePanel.vue';
import FileBrowser from './components/FileBrowser.vue';
import { useSettingsStore } from './stores/settings.js';
import { useAudioIntegration } from './composables/useAudioIntegration.js';
import { onMounted } from 'vue';

const settingsStore = useSettingsStore();
const { initializeIntegration, enhanceAudioManager } = useAudioIntegration();

onMounted(() => {
  // Load settings from localStorage
  settingsStore.loadSettings();
  
  // Initialize audio integration after a short delay to ensure renderer.js has loaded
  setTimeout(() => {
    enhanceAudioManager();
    initializeIntegration();
  }, 500);
});
</script>

<style scoped>
/* Main styles are in styles.css */
#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>

