<template>
  <div class="sidebar-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="switchTab(tab.id)"
      :class="['tab-button', { active: activeTab === tab.id }]"
      :title="tab.title"
    >
      <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
        <path :d="tab.iconPath" />
      </svg>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUIStore } from '../stores/ui.js';

const uiStore = useUIStore();

const activeTab = computed(() => uiStore.activeSidebarTab);

const tabs = [
  {
    id: 'files',
    label: 'Files',
    title: 'File Browser',
    iconPath: 'M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z'
  },
  {
    id: 'spotify',
    label: 'Spotify',
    title: 'Spotify',
    iconPath: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z'
  },
  {
    id: 'youtube',
    label: 'YouTube',
    title: 'YouTube',
    iconPath: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
  }
];

const switchTab = (tabId) => {
  if (!uiStore) {
    console.error('[SidebarTabs] Store not available');
    return;
  }
  
  // Validate tab ID
  if (!['files', 'spotify', 'youtube'].includes(tabId)) {
    console.error('[SidebarTabs] Invalid tab ID:', tabId);
    return;
  }
  
  // Directly set the state - Pinia handles reactivity automatically
  uiStore.activeSidebarTab = tabId;
};
</script>

<style scoped>
.sidebar-tabs {
  display: flex;
  flex-direction: row;
  gap: 4px;
  padding: 8px;
  background: rgba(30, 31, 34, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.tab-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: rgba(181, 186, 193, 0.6);
  min-height: 70px;
  position: relative;
}

.tab-button:hover {
  background: rgba(79, 84, 92, 0.16);
  color: rgba(255, 255, 255, 0.9);
}

.tab-button.active {
  background: rgba(0, 255, 136, 0.15);
  color: var(--theme-primary, #00ff88);
  border: 2px solid var(--theme-primary, #00ff88);
}

.tab-button.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--theme-primary, #00ff88);
  border-radius: 0 2px 2px 0;
}

.tab-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.tab-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
</style>

