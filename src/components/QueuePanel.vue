<template>
  <div class="queue-panel" :class="{ hidden: !isOpen }" id="queuePanel">
    <div class="queue-header">
      <h4>Queue</h4>
      <button @click="close" class="icon-btn">×</button>
    </div>
    <div class="queue-list" id="queueList">
      <div v-if="queue.length === 0" class="empty-state">No songs in queue</div>
      <div
        v-for="(item, index) in queue"
        :key="index"
        :class="['queue-item', { current: index === currentIndex }]"
        @click="playTrack(index)"
      >
        <span class="queue-item-number">{{ index + 1 }}</span>
        <span class="file-icon" style="width: 40px; height: 40px; flex-shrink: 0;">
          <img 
            v-if="item.albumArt" 
            :src="item.albumArt" 
            alt="Album art" 
            style="width: 100%; height: 100%; object-fit: cover; border-radius: 3px;"
          />
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </span>
        <div class="file-content">
          <div class="file-title">{{ item.title || item.name || 'Unknown' }}</div>
          <div v-if="item.artist || item.album" class="file-artist">
            <template v-if="item.artist && item.album">
              {{ item.artist }} • {{ item.album }}
            </template>
            <template v-else-if="item.artist">
              {{ item.artist }}
            </template>
            <template v-else-if="item.album">
              {{ item.album }}
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, ref } from 'vue';
import { useAudioStore } from '../stores/audio.js';
import { useUIStore } from '../stores/ui.js';
import { useSettingsStore } from '../stores/settings.js';

const audioStore = useAudioStore();
const uiStore = useUIStore();
const settingsStore = useSettingsStore();

const isOpen = computed(() => uiStore.queuePanelOpen);
const queue = computed(() => audioStore.queue);
const currentIndex = computed(() => audioStore.currentIndex);

const close = () => {
  uiStore.toggleQueuePanel();
};

const playTrack = (index) => {
  if (window.audioManager && window.audioManager.loadAudioFile) {
    window.audioManager.loadAudioFile(index);
    if (!audioStore.isPlaying) {
      setTimeout(() => {
        if (window.audioManager && window.audioManager.play) {
          window.audioManager.play();
        }
      }, 100);
    }
    close();
  }
};

// Sync queue from global audioFiles (polling since window.audioFiles is not reactive)
const syncQueue = () => {
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

// Initial sync
syncQueue();

// Poll for changes
let queueSyncInterval = setInterval(syncQueue, 500);

// Watch for current index updates
watch(() => window.currentFileIndex, (newIndex) => {
  if (typeof newIndex === 'number') {
    audioStore.setCurrentIndex(newIndex);
  }
}, { immediate: true });

// Track which queue items have had album art loaded
const loadedQueueArts = ref(new Set());

// Load album art for queue items
onMounted(() => {
  const loadAlbumArts = async () => {
    if (!settingsStore.albumArtBackground || !window.albumArtManager) return;
    
    // Only load art for items that don't have it and haven't been loaded yet
    const itemsToLoad = queue.value.filter((item, index) => 
      !item.albumArt && 
      item.path && 
      !loadedQueueArts.value.has(item.path)
    );
    
    if (itemsToLoad.length === 0) return;
    
    // Process in batches
    const batchSize = 3;
    for (let i = 0; i < itemsToLoad.length; i += batchSize) {
      const batch = itemsToLoad.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (item) => {
        if (loadedQueueArts.value.has(item.path)) return;
        
        try {
          const artUrl = await window.albumArtManager.extractAlbumArt(item.path);
          if (artUrl) {
            const index = queue.value.findIndex(q => q.path === item.path);
            if (index >= 0) {
              const updatedQueue = [...queue.value];
              updatedQueue[index] = { ...updatedQueue[index], albumArt: artUrl };
              audioStore.setQueue(updatedQueue);
            }
            loadedQueueArts.value.add(item.path);
          }
        } catch (error) {
          // Silently fail
          loadedQueueArts.value.add(item.path); // Mark as attempted to prevent retries
        }
      }));
      
      // Small delay between batches
      if (i + batchSize < itemsToLoad.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  };
  
  loadAlbumArts();
  
  // Watch for queue changes to load album arts (but only for new items)
  watch(queue, (newQueue, oldQueue) => {
    // Only reload if queue actually changed (new items added)
    if (!oldQueue || newQueue.length !== oldQueue.length || 
        newQueue.some((item, idx) => !oldQueue[idx] || item.path !== oldQueue[idx].path)) {
      loadAlbumArts();
    }
  }, { deep: false }); // Shallow watch to avoid infinite loops
});

onUnmounted(() => {
  if (queueSyncInterval) {
    clearInterval(queueSyncInterval);
  }
});
</script>

<style scoped>
/* Styles are in global styles.css */
</style>

