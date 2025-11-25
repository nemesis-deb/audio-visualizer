<template>
  <div class="right-panel" id="rightPanel">
    <div class="right-panel-header">
      <h3>Visualizer</h3>
    </div>

    <div class="right-panel-section">
      <label>Type</label>
      <select 
        v-model="selectedVisualizer" 
        @change="onVisualizerChange"
        id="visualizerSelect"
        ref="visualizerSelectRef"
      >
        <option v-for="name in visualizerNames" :key="name" :value="name">
          {{ name }}
        </option>
      </select>
    </div>

    <div class="right-panel-section" id="visualizerTweaksPanel">
      <label>Settings</label>
      <div class="tweaks-content" id="visualizerTweaksContent">
        <p v-if="visualizerSettings.length === 0" class="empty-tweaks">No custom settings for this visualizer</p>
        <div v-for="setting in visualizerSettings" :key="setting.key" class="setting-item">
          <!-- Range input -->
          <template v-if="setting.type === 'range'">
            <label>{{ setting.label }}: <span>{{ setting.value }}</span></label>
            <input 
              type="range" 
              :min="setting.min" 
              :max="setting.max" 
              :step="setting.step || 1" 
              :value="setting.value"
              @input="onSettingChange(setting.key, parseFloat($event.target.value))"
            >
          </template>
          
          <!-- Select input -->
          <template v-else-if="setting.type === 'select'">
            <label>{{ setting.label }}:</label>
            <select 
              :value="setting.value" 
              @change="onSettingChange(setting.key, $event.target.value)"
              class="setting-select"
            >
              <option v-for="opt in setting.options" :key="opt" :value="opt">
                {{ opt.charAt(0).toUpperCase() + opt.slice(1) }}
              </option>
            </select>
          </template>
          
          <!-- Checkbox input -->
          <template v-else-if="setting.type === 'checkbox'">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                :checked="setting.value"
                @change="onSettingChange(setting.key, $event.target.checked)"
              >
              <span>{{ setting.label }}</span>
            </label>
          </template>
        </div>
      </div>
    </div>

    <!-- Preset buttons -->
    <div class="preset-buttons-section">
      <button 
        @click="savePreset" 
        class="preset-btn-panel" 
        title="Save current settings as preset"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        Save
      </button>
      <button 
        @click="loadPreset" 
        class="preset-btn-panel" 
        title="Load preset from file"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Load
      </button>
    </div>

    <!-- Status at bottom -->
    <div class="right-panel-footer">
      <span id="status">{{ statusMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useVisualizerStore } from '../stores/visualizer.js';
import { useUIStore } from '../stores/ui.js';
import { useElectronIPC } from '../composables/useElectronIPC.js';

const visualizerStore = useVisualizerStore();
const uiStore = useUIStore();
const { send } = useElectronIPC();

const visualizerSelectRef = ref(null);
const selectedVisualizer = ref('Spectra');
const visualizerSettings = ref([]);
const statusMessage = ref('No audio source');

// Cleanup references
let managerCheckInterval = null;
let presetLoadedHandler = null;

const visualizerNames = computed(() => {
  if (window.visualizerManager) {
    return window.visualizerManager.getVisualizerNames ? 
      window.visualizerManager.getVisualizerNames() : 
      Array.from(window.visualizerManager.visualizers.keys());
  }
  return [];
});

const updateVisualizerSettings = () => {
  if (window.visualizerManager && window.visualizerManager.currentVisualizer) {
    const visualizer = window.visualizerManager.currentVisualizer;
    const customSettings = visualizer.getCustomSettings ? visualizer.getCustomSettings() : [];
    visualizerSettings.value = customSettings;
  } else {
    visualizerSettings.value = [];
  }
};

const onVisualizerChange = () => {
  if (window.visualizerManager && selectedVisualizer.value) {
    if (window.visualizerManager.setActive(selectedVisualizer.value)) {
      visualizerStore.setCurrentVisualizer(window.visualizerManager.currentVisualizer);
      updateVisualizerSettings();
      
      // Update Discord presence if available
      if (window.updateDiscordPresence) {
        window.updateDiscordPresence();
      }
    }
  }
};

const onSettingChange = (key, value) => {
  if (window.visualizerManager && window.visualizerManager.currentVisualizer) {
    const visualizer = window.visualizerManager.currentVisualizer;
    if (visualizer.updateSetting) {
      visualizer.updateSetting(key, value);
      updateVisualizerSettings();
    }
  }
};

const savePreset = async () => {
  if (!window.visualizerManager || !window.visualizerManager.currentVisualizer) {
    showNotification('No visualizer active', 'error');
    return;
  }
  
  const visualizer = window.visualizerManager.currentVisualizer;
  const preset = {
    visualizerName: visualizer.name,
    settings: visualizer.getSettings ? visualizer.getSettings() : {}
  };
  
  try {
    // Use Electron IPC to save file
    send('save-preset', preset);
  } catch (error) {
    console.error('Error saving preset:', error);
    showNotification('Failed to save preset', 'error');
  }
};

const loadPreset = async () => {
  try {
    // Use Electron IPC to load file
    send('load-preset');
  } catch (error) {
    console.error('Error loading preset:', error);
    showNotification('Failed to load preset', 'error');
  }
};

const showNotification = (message, type = 'info') => {
  // Simple notification - can be enhanced later
  console.log(`[${type.toUpperCase()}] ${message}`);
  statusMessage.value = message;
  setTimeout(() => {
    statusMessage.value = 'No audio source';
  }, 3000);
};

// Watch for visualizer manager and names changes
watch(() => visualizerNames.value, (names) => {
  if (names.length > 0) {
    // Update selected if current is not in list
    if (!names.includes(selectedVisualizer.value)) {
      const current = window.visualizerManager?.getCurrentName();
      if (current && names.includes(current)) {
        selectedVisualizer.value = current;
      } else {
        selectedVisualizer.value = names[0];
        if (window.visualizerManager) {
          window.visualizerManager.setActive(names[0]);
        }
      }
    }
    updateVisualizerSettings();
  }
}, { immediate: true });

// Watch for visualizer changes
watch(() => window.visualizerManager?.currentVisualizer, () => {
  if (window.visualizerManager) {
    const current = window.visualizerManager.getCurrentName();
    if (current && current !== selectedVisualizer.value) {
      selectedVisualizer.value = current;
    }
    updateVisualizerSettings();
  }
}, { deep: true });

// Watch for status changes
watch(() => window.statusText, (newStatus) => {
  if (newStatus) {
    statusMessage.value = newStatus;
  }
});

onMounted(async () => {
  await nextTick();
  
  // Wait for visualizer manager to be available
  const waitForManager = () => {
    if (window.visualizerManager) {
      const names = visualizerNames.value;
      console.log('[VisualizerPanel] Visualizer names:', names);
      
      if (names.length > 0) {
        // Set default if none selected
        if (!selectedVisualizer.value || !names.includes(selectedVisualizer.value)) {
          selectedVisualizer.value = names[0];
        }
        
        // Set current visualizer name if available
        const current = window.visualizerManager.getCurrentName();
        if (current && names.includes(current)) {
          selectedVisualizer.value = current;
        } else if (names.length > 0) {
          // Set first visualizer as active if none is set
          window.visualizerManager.setActive(names[0]);
          selectedVisualizer.value = names[0];
        }
        
        updateVisualizerSettings();
      } else {
        // Retry if no visualizers yet
        setTimeout(waitForManager, 100);
      }
    } else {
      // Retry if manager not available
      setTimeout(waitForManager, 100);
    }
  };
  
  waitForManager();
  
  // Initialize custom select for visualizer dropdown
  const initCustomSelect = () => {
    if (!visualizerSelectRef.value) {
      console.warn('Visualizer select element not found');
      return;
    }
    if (!window.createCustomSelect) {
      console.warn('window.createCustomSelect not available yet');
      return;
    }
    
    // Check if custom select already exists
    if (visualizerSelectRef.value.nextElementSibling?.classList.contains('custom-select')) {
      console.log('Visualizer select already has custom select');
      return;
    }
    
    console.log('Initializing visualizer select:', visualizerSelectRef.value);
    try {
      window.createCustomSelect(visualizerSelectRef.value);
      console.log('Visualizer select initialized successfully');
    } catch (error) {
      console.error('Error initializing visualizer select:', error);
    }
  };
  
  // Wait for createCustomSelect to be available
  const waitForCreateCustomSelect = () => {
    if (window.createCustomSelect) {
      initCustomSelect();
    } else {
      setTimeout(waitForCreateCustomSelect, 100);
    }
  };
  
  await nextTick();
  // Start checking after a short delay
  setTimeout(waitForCreateCustomSelect, 100);
  
  // Watch for visualizer manager initialization
  const checkManager = () => {
    if (window.visualizerManager) {
      const names = visualizerNames.value;
      if (names.length > 0) {
        const current = window.visualizerManager.getCurrentName();
        if (current) {
          selectedVisualizer.value = current;
        }
        updateVisualizerSettings();
      }
      // Initialize custom select for visualizer type
      setTimeout(initCustomSelect, 200);
      clearInterval(managerCheckInterval); // Stop checking once found
    }
  };
  
  managerCheckInterval = setInterval(checkManager, 1000);
});

// Listen for preset loaded event
onMounted(() => {
  const handlePresetLoaded = (event, preset) => {
    if (preset && window.visualizerManager) {
      // Switch to visualizer if needed
      if (preset.visualizerName && preset.visualizerName !== window.visualizerManager.getCurrentName()) {
        window.visualizerManager.setActive(preset.visualizerName);
        selectedVisualizer.value = preset.visualizerName;
      }
      
      // Apply settings
      const visualizer = window.visualizerManager.currentVisualizer;
      if (visualizer && preset.settings) {
        Object.entries(preset.settings).forEach(([key, value]) => {
          if (visualizer.updateSetting) {
            visualizer.updateSetting(key, value);
          }
        });
        updateVisualizerSettings();
      }
      
      showNotification('Preset loaded', 'success');
    }
  };
  
  // Listen via Electron IPC if available
  if (window.ipcRenderer) {
    presetLoadedHandler = handlePresetLoaded;
    window.ipcRenderer.on('preset-loaded', presetLoadedHandler);
  }
});

// Cleanup on unmount
onUnmounted(() => {
  if (managerCheckInterval) {
    clearInterval(managerCheckInterval);
    managerCheckInterval = null;
  }
  if (window.ipcRenderer && presetLoadedHandler) {
    window.ipcRenderer.removeListener('preset-loaded', presetLoadedHandler);
    presetLoadedHandler = null;
  }
});
</script>

<style scoped>
/* Styles are in global styles.css */
</style>

