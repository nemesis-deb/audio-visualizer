/**
 * Electron IPC Event Manager
 * Clean wrapper for Electron IPC communication
 * Similar to Amethyst's electronEventManager.ts
 */
export class ElectronEventManager {
  constructor() {
    this.ipc = window.electron?.ipcRenderer || null;
    if (!this.ipc) {
      console.warn('Electron IPC not available - running in web mode?');
    }
  }

  // File operations
  openFileDialog() {
    return this.ipc?.invoke('open-file-dialog') || Promise.resolve({ canceled: true });
  }

  openFolderDialog() {
    // Electron returns folder path directly, not an object
    return this.ipc?.invoke('open-folder-dialog') || Promise.resolve(null);
  }

  showSaveDialog() {
    return this.ipc?.invoke('show-save-dialog') || Promise.resolve({ canceled: true });
  }

  // Metadata operations
  extractMetadata(path) {
    return this.ipc?.invoke('extract-metadata', path) || Promise.resolve(null);
  }

  getCoverArt(path) {
    return this.ipc?.invoke('get-cover-art', path) || Promise.resolve(null);
  }

  // Window operations
  minimizeWindow() {
    return this.ipc?.invoke('minimize-window') || Promise.resolve();
  }

  maximizeWindow() {
    return this.ipc?.invoke('maximize-window') || Promise.resolve();
  }

  closeWindow() {
    return this.ipc?.invoke('close-window') || Promise.resolve();
  }

  // Discord RPC
  updateDiscordPresence(args) {
    return this.ipc?.invoke('update-discord-presence', args) || Promise.resolve();
  }

  clearDiscordPresence() {
    return this.ipc?.invoke('clear-discord-presence') || Promise.resolve();
  }

  // Spotify
  spotifyAuth() {
    return this.ipc?.invoke('spotify-auth') || Promise.resolve(null);
  }

  spotifyGetPlaylists() {
    return this.ipc?.invoke('spotify-get-playlists') || Promise.resolve([]);
  }

  spotifySearch(query) {
    return this.ipc?.invoke('spotify-search', query) || Promise.resolve({ tracks: { items: [] } });
  }

  spotifyGetPlaylistTracks(playlistId) {
    return this.ipc?.invoke('spotify-get-playlist-tracks', playlistId) || Promise.resolve({ tracks: { items: [] } });
  }

  spotifyGetTrackFeatures(trackId) {
    return this.ipc?.invoke('spotify-get-track-features', trackId) || Promise.resolve(null);
  }

  // YouTube
  youtubeSearch(query) {
    return this.ipc?.invoke('youtube-search', query) || Promise.resolve([]);
  }

  youtubeGetAudio(url) {
    return this.ipc?.invoke('youtube-get-audio', url) || Promise.resolve(null);
  }

  // Settings
  getSettings() {
    return this.ipc?.invoke('get-settings') || Promise.resolve({});
  }

  saveSettings(settings) {
    return this.ipc?.invoke('save-settings', settings) || Promise.resolve();
  }

  // System
  openExternal(url) {
    return this.ipc?.invoke('open-external', url) || Promise.resolve();
  }

  showItemInFolder(path) {
    return this.ipc?.invoke('show-item-in-folder', path) || Promise.resolve();
  }

  // Listen for events from main process
  on(channel, callback) {
    if (this.ipc) {
      this.ipc.on(channel, callback);
    }
  }

  removeListener(channel, callback) {
    if (this.ipc) {
      this.ipc.removeListener(channel, callback);
    }
  }
}

