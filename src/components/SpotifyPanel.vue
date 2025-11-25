<template>
  <div v-if="isOpen" class="spotify-panel sidebar" id="spotifyPanel">
    <div class="sidebar-content">
      <!-- Login State -->
      <div v-if="!isConnected" class="spotify-login-state" id="spotifyLogin">
        <div class="login-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <h3 class="login-title">Connect Spotify</h3>
        <p class="login-subtitle">Access your playlists and search tracks</p>
        <button 
          @click="connectSpotify"
          id="spotifyLoginBtn"
          class="spotify-connect-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect Spotify
        </button>
      </div>
      
      <!-- Connected State -->
      <div v-else class="spotify-connected-state" id="spotifyConnected">
        <!-- User Info Bar -->
        <div class="spotify-user-bar">
          <div class="user-info">
            <svg class="user-status-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l2 2 4-4" stroke-linecap="round" />
            </svg>
            <div class="user-details">
              <div id="spotifyUsername" class="username">{{ username }}</div>
              <div class="user-status">Connected</div>
            </div>
          </div>
          <button 
            @click="disconnectSpotify"
            id="spotifyLogoutBtn"
            class="disconnect-btn"
          >
            Disconnect
          </button>
        </div>
        
        <!-- Actions -->
        <div class="spotify-actions">
          <button 
            @click="loadPlaylists"
            id="loadPlaylistsBtn"
            class="spotify-action-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Load Playlists
          </button>
        </div>
        
        <!-- Search -->
        <div class="spotify-search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            v-model="searchQuery"
            @keyup.enter="searchTracks"
            id="spotifySearchInput" 
            placeholder="Search tracks..."
            class="spotify-search-input"
          />
        </div>
        
        <!-- Search Results -->
        <div class="spotify-results-section">
          <div v-if="searchResults.length === 0" class="spotify-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <p class="empty-text">Search for tracks to get started</p>
          </div>
          
          <div 
            v-for="(track, index) in searchResults" 
            :key="index"
            @click="playTrack(track)"
            class="spotify-track-item"
          >
            <div class="track-artwork">
              <img 
                v-if="track.album?.images?.[0]?.url" 
                :src="track.album.images[0].url" 
                alt="Album art"
                class="track-image"
              />
              <div v-else class="track-image-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <div class="track-play-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="10,8 10,16 16,12" />
                </svg>
              </div>
            </div>
            <div class="track-info">
              <div class="track-name">{{ track.name }}</div>
              <div class="track-artist">{{ track.artists?.map(a => a.name).join(', ') || 'Unknown Artist' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUIStore } from '../stores/ui.js';
import { useElectronIPC } from '../composables/useElectronIPC.js';

const uiStore = useUIStore();
const { send, on } = useElectronIPC();

const isConnected = ref(false);
const username = ref('');
const searchQuery = ref('');
const searchResults = ref([]);

const isOpen = computed(() => uiStore.activeSidebarTab === 'spotify');

// No close button - tabs handle switching

const connectSpotify = () => {
  if (window.spotifyIntegration && window.spotifyIntegration.connect) {
    window.spotifyIntegration.connect();
  } else {
    send('spotify-connect');
  }
};

const disconnectSpotify = () => {
  if (window.spotifyIntegration && window.spotifyIntegration.disconnect) {
    window.spotifyIntegration.disconnect();
  } else {
    send('spotify-disconnect');
  }
  isConnected.value = false;
  username.value = '';
};

const loadPlaylists = () => {
  if (window.spotifyIntegration && window.spotifyIntegration.loadPlaylists) {
    window.spotifyIntegration.loadPlaylists();
  } else {
    send('spotify-load-playlists');
  }
};

const searchTracks = async () => {
  if (!searchQuery.value.trim()) return;
  
  if (window.spotifyIntegration && window.spotifyIntegration.search) {
    const results = await window.spotifyIntegration.search(searchQuery.value);
    searchResults.value = results?.tracks?.items || [];
  } else {
    send('spotify-search', { query: searchQuery.value });
  }
};

const playTrack = (track) => {
  if (window.spotifyIntegration && window.spotifyIntegration.playTrack) {
    window.spotifyIntegration.playTrack(track);
  } else {
    send('spotify-play-track', track);
  }
};

// Listen for Spotify connection events
onMounted(() => {
  const handleSpotifyConnected = (event, userData) => {
    isConnected.value = true;
    username.value = userData?.display_name || userData?.username || 'User';
  };
  
  const handleSpotifyDisconnected = () => {
    isConnected.value = false;
    username.value = '';
    searchResults.value = [];
  };
  
  const handleSpotifySearchResults = (event, results) => {
    searchResults.value = results?.tracks?.items || [];
  };
  
  // Check initial connection state
  if (window.spotifyIntegration && window.spotifyIntegration.isConnected) {
    isConnected.value = window.spotifyIntegration.isConnected();
    if (isConnected.value && window.spotifyIntegration.getUser) {
      const user = window.spotifyIntegration.getUser();
      username.value = user?.display_name || user?.username || 'User';
    }
  }
  
  // Listen for events
  on('spotify-connected', handleSpotifyConnected);
  on('spotify-disconnected', handleSpotifyDisconnected);
  on('spotify-search-results', handleSpotifySearchResults);
});
</script>

<style scoped>
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Login State */
.spotify-login-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  height: 100%;
}

.login-icon {
  color: #1DB954;
  margin-bottom: 20px;
}

.login-icon svg {
  filter: drop-shadow(0 2px 8px rgba(29, 185, 84, 0.3));
}

.login-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 13px;
  color: #888;
  margin: 0 0 24px 0;
}

.spotify-connect-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 200px;
  background: #1DB954;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.spotify-connect-btn:hover {
  background: #1ed760;
  transform: scale(1.02);
}

/* Connected State */
.spotify-connected-state {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.spotify-user-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background: rgba(29, 185, 84, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.user-status-icon {
  color: #1DB954;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.username {
  color: #1DB954;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  color: #888;
  font-size: 11px;
}

.disconnect-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.disconnect-btn:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #aaa;
}

.spotify-actions {
  padding: 12px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.spotify-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.2);
  color: var(--theme-primary, #00ff88);
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s;
}

.spotify-action-btn:hover {
  background: rgba(0, 255, 136, 0.15);
  border-color: rgba(0, 255, 136, 0.3);
}

.spotify-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.search-icon {
  position: absolute;
  left: 27px;
  color: #888;
  pointer-events: none;
  z-index: 1;
}

.spotify-search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.spotify-search-input:focus {
  border-color: #1DB954;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.1);
}

.spotify-search-input::placeholder {
  color: #666;
}

.spotify-results-section {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.spotify-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.spotify-empty-state svg {
  color: #444;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 13px;
  color: #888;
  margin: 0;
}

.spotify-track-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.spotify-track-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(29, 185, 84, 0.2);
  transform: translateX(2px);
}

.track-artwork {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #1a1a1a;
}

.track-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
  background: #1a1a1a;
}

.track-play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: #1DB954;
}

.spotify-track-item:hover .track-play-overlay {
  opacity: 1;
}

.track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-name {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  color: #888;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

