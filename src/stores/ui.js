import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    // Panel visibility
    settingsPanelOpen: false,
    queuePanelOpen: false,
    fileBrowserOpen: true, // Default open
    spotifyPanelOpen: false,
    youtubePanelOpen: false,
    
    // Modal visibility
    aboutModalOpen: false,
    
    // UI state
    fullscreen: false,
    statusMessage: '',
    
    // Active menu
    activeMenu: null
  }),

  actions: {
    toggleSettingsPanel() {
      this.settingsPanelOpen = !this.settingsPanelOpen;
    },
    
    toggleQueuePanel() {
      this.queuePanelOpen = !this.queuePanelOpen;
    },
    
    toggleFileBrowser() {
      this.fileBrowserOpen = !this.fileBrowserOpen;
    },
    
    setFileBrowserOpen(open) {
      this.fileBrowserOpen = open;
    },
    
    toggleSpotifyPanel() {
      this.spotifyPanelOpen = !this.spotifyPanelOpen;
    },
    
    toggleYouTubePanel() {
      this.youtubePanelOpen = !this.youtubePanelOpen;
    },
    
    setStatusMessage(message) {
      this.statusMessage = message;
    },
    
    setFullscreen(fullscreen) {
      this.fullscreen = fullscreen;
    },
    
    setActiveMenu(menu) {
      this.activeMenu = menu;
    },
    
    closeAllMenus() {
      this.activeMenu = null;
    }
  }
});

