<template>
  <div class="youtube-panel" :class="{ hidden: !isOpen }" id="youtubePanel">
    <div style="text-align: center;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="margin: 10px auto; display: block;">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="#FF0000" stroke-width="2" />
        <polygon points="10,8 10,16 16,12" fill="#FF0000" />
      </svg>
      <p style="color: #888; font-size: 13px; margin: 10px 0;">
        Search and play YouTube videos with visualization
      </p>
      
      <div class="youtube-search-container-sidebar" style="margin-top: 15px;">
        <input 
          type="text" 
          v-model="searchQuery"
          @keyup.enter="searchVideos"
          id="youtubeSidebarSearch" 
          placeholder="Search YouTube..." 
          autocomplete="off"
          style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid #FF0000; border-radius: 5px; color: #fff; font-size: 13px; margin-bottom: 10px;"
        />
        <button 
          @click="searchVideos"
          id="youtubeSidebarSearchBtn"
          style="width: 100%; background: #FF0000; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 14px;"
        >
          🔍 Search YouTube
        </button>
      </div>
      
      <div id="youtubeResultsSidebar" style="margin-top: 15px; max-height: 400px; overflow-y: auto;">
        <div 
          v-for="(video, index) in searchResults" 
          :key="index"
          @click="playVideo(video)"
          style="padding: 10px; margin: 5px 0; background: #1a1a1a; border-radius: 3px; cursor: pointer; display: flex; gap: 10px;"
          class="youtube-video-item"
        >
          <img 
            v-if="video.thumbnail" 
            :src="video.thumbnail" 
            alt="Thumbnail"
            style="width: 80px; height: 60px; border-radius: 3px; object-fit: cover; flex-shrink: 0;"
          />
          <div style="flex: 1; min-width: 0;">
            <div style="color: #fff; font-size: 13px; font-weight: 500; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{ video.title }}
            </div>
            <div style="color: #888; font-size: 11px;">
              {{ video.channel || video.channelTitle }}
            </div>
            <div v-if="video.duration" style="color: #666; font-size: 10px; margin-top: 2px;">
              {{ formatDuration(video.duration) }}
            </div>
          </div>
        </div>
        <div v-if="searchResults.length === 0 && !isSearching" style="color: #888; text-align: center; padding: 20px;">
          No results yet. Search for videos above.
        </div>
        <div v-if="isSearching" style="color: #888; text-align: center; padding: 20px;">
          Searching...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUIStore } from '../stores/ui.js';
import { useElectronIPC } from '../composables/useElectronIPC.js';

const uiStore = useUIStore();
const { send, on } = useElectronIPC();

const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);

const isOpen = computed(() => uiStore.youtubePanelOpen);

const searchVideos = async () => {
  if (!searchQuery.value.trim()) return;
  
  isSearching.value = true;
  searchResults.value = [];
  
  if (window.youtubeIntegration && window.youtubeIntegration.search) {
    try {
      const results = await window.youtubeIntegration.search(searchQuery.value);
      searchResults.value = results || [];
    } catch (error) {
      console.error('YouTube search error:', error);
    } finally {
      isSearching.value = false;
    }
  } else {
    send('youtube-search', { query: searchQuery.value });
  }
};

const playVideo = (video) => {
  if (window.youtubeIntegration && window.youtubeIntegration.playVideo) {
    window.youtubeIntegration.playVideo(video);
  } else if (window.audioManager && window.audioManager.setAudioSource) {
    // Use audio manager to play YouTube video
    const videoUrl = video.url || video.id || `https://www.youtube.com/watch?v=${video.videoId || video.id}`;
    window.audioManager.setAudioSource(videoUrl);
  } else {
    send('youtube-play', video);
  }
};

const formatDuration = (duration) => {
  if (!duration) return '';
  
  // Handle ISO 8601 duration format (PT1H2M10S)
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  // Handle seconds as number
  if (typeof duration === 'number') {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  return duration;
};

// Listen for YouTube search results
on('youtube-search-results', (event, results) => {
  searchResults.value = results || [];
  isSearching.value = false;
});
</script>

<style scoped>
.youtube-video-item:hover {
  background: #333 !important;
}
</style>

