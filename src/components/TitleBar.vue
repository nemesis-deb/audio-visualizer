<template>
  <div class="custom-title-bar">
    <div class="title-bar-drag-area title-bar-drag-left"></div>
    <div class="title-bar-left">
      <div class="app-icon">
        <!-- SVG icon will be added here - use #icon-big from index.html -->
        <svg width="30" height="30" viewBox="0 0 1024 1024" preserveAspectRatio="xMidYMid meet">
          <use href="#icon-big"></use>
        </svg>
      </div>
      <MenuBar />
    </div>
    <div class="title-bar-center">
      <span class="app-name">Spectra</span>
      <span class="app-version">1.1.0</span>
    </div>
    <div class="title-bar-drag-area title-bar-drag-right"></div>
    <div class="title-bar-right">
      <button 
        class="window-control minimize" 
        @click="minimizeWindow"
        title="Minimize"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M0 6h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <button 
        class="window-control maximize" 
        @click="maximizeWindow"
        :title="isMaximized ? 'Restore' : 'Maximize'"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path 
            v-if="isMaximized"
            d="M2 2h8v8H2z" 
            stroke="currentColor" 
            stroke-width="1.5" 
            fill="none"
          />
          <path 
            v-if="isMaximized"
            d="M4 4h6v6" 
            stroke="currentColor" 
            stroke-width="1.5" 
            fill="none"
          />
          <path 
            v-else
            d="M1 1h10v10H1z" 
            stroke="currentColor" 
            stroke-width="1.5" 
            fill="none" 
          />
        </svg>
      </button>
      <button 
        class="window-control close" 
        @click="closeWindow"
        title="Close"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useElectronIPC } from '../composables/useElectronIPC.js';
import MenuBar from './MenuBar.vue';

const { send, on, removeListener } = useElectronIPC();
const isMaximized = ref(false);

// Window control handlers
const minimizeWindow = () => {
  send('window-minimize');
};

const maximizeWindow = () => {
  send('window-maximize');
};

const closeWindow = () => {
  send('window-close');
};

// Listen for window state changes
const handleWindowMaximized = () => {
  isMaximized.value = true;
};

const handleWindowUnmaximized = () => {
  isMaximized.value = false;
};

const handleWindowState = (event, maximized) => {
  isMaximized.value = maximized;
};

onMounted(() => {
  // Request initial window state
  send('get-window-state');
  
  // Listen for window state changes
  on('window-maximized', handleWindowMaximized);
  on('window-unmaximized', handleWindowUnmaximized);
  on('window-state', handleWindowState);
});

onUnmounted(() => {
  removeListener('window-maximized', handleWindowMaximized);
  removeListener('window-unmaximized', handleWindowUnmaximized);
  removeListener('window-state', handleWindowState);
});
</script>

<style scoped>
/* Styles are in main styles.css - no need to duplicate */
</style>

