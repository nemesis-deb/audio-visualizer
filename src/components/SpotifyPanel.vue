<template>
  <div class="spotify-panel" :class="{ hidden: !isOpen }" id="spotifyPanel">
    <!-- Login State -->
    <div v-if="!isConnected" id="spotifyLogin" style="text-align: center;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="margin: 10px auto; display: block;">
        <circle cx="12" cy="12" r="10" stroke="#1DB954" stroke-width="2" />
        <path d="M8 11c2.5-1.5 5.5-1.5 8 0M8.5 14c2-1 4-1 6 0M9 17c1.5-0.5 3-0.5 4.5 0" stroke="#1DB954"
          stroke-width="2" stroke-linecap="round" />
      </svg>
      <p style="color: #888; font-size: 13px; margin: 10px 0;">
        Connect your Spotify account to access your playlists
      </p>
      <button 
        @click="connectSpotify"
        id="spotifyLoginBtn"
        style="width: 100%; background: #1DB954; color: white; padding: 10px; border: none; border-radius: 20px; cursor: pointer; font-weight: 600; font-size: 14px;"
      >
        Connect Spotify
      </button>
    </div>
    
    <!-- Connected State -->
    <div v-else id="spotifyConnected">
      <div
        style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 8px; background: rgba(29, 185, 84, 0.1); border-radius: 3px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#1DB954" stroke-width="2" />
          <path d="M8 12l2 2 4-4" stroke="#1DB954" stroke-width="2" stroke-linecap="round" />
        </svg>
        <div style="flex: 1;">
          <div id="spotifyUsername" style="color: #1DB954; font-size: 13px; font-weight: 600;">
            {{ username }}
          </div>
          <div style="color: #888; font-size: 11px;">Connected</div>
        </div>
        <button 
          @click="disconnectSpotify"
          id="spotifyLogoutBtn"
          style="padding: 5px 10px; background: transparent; border: 1px solid #444; color: #888; border-radius: 3px; cursor: pointer; font-size: 11px;"
        >
          Disconnect
        </button>
      </div>
      
      <button 
        @click="loadPlaylists"
        id="loadPlaylistsBtn"
        style="width: 100%; background: #00ff88; color: #000; padding: 8px; border: none; border-radius: 3px; cursor: pointer; font-weight: 600; font-size: 13px; margin-bottom: 10px;"
      >
        Load Playlists
      </button>
      
      <div style="position: relative; margin-bottom: 10px;">
        <input 
          type="text" 
          v-model="searchQuery"
          @keyup.enter="searchTracks"
          id="spotifySearchInput" 
          placeholder="Search tracks on Spotify..."
          style="width: 100%; padding: 8px 35px 8px 10px; background: #2a2a2a; border: 1px solid #444; border-radius: 3px; color: #fff; font-size: 13px;"
        />
        <svg 
          @click="searchTracks"
          id="spotifySearchBtn" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#888"
          stroke-width="2"
          style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer;"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      
      <!-- Search Results -->
      <div v-if="searchResults.length > 0" style="max-height: 300px; overflow-y: auto;">
        <div 
          v-for="(track, index) in searchResults" 
          :key="index"
          @click="playTrack(track)"
          style="padding: 8px; margin: 5px 0; background: #1a1a1a; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 10px;"
          class="spotify-track-item"
        >
          <img 
            v-if="track.album?.images?.[0]?.url" 
            :src="track.album.images[0].url" 
            alt="Album art"
            style="width: 40px; height: 40px; border-radius: 3px; object-fit: cover;"
          />
          <div style="flex: 1; min-width: 0;">
            <div style="color: #fff; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{ track.name }}
            </div>
            <div style="color: #888; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{ track.artists?.map(a => a.name).join(', ') }}
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

const isOpen = computed(() => uiStore.spotifyPanelOpen);

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
.spotify-track-item:hover {
  background: #333 !important;
}
</style>

