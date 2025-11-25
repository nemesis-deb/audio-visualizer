# Vue.js Migration Plan for Spectra

## Overview
This document outlines the step-by-step plan to migrate the Spectra audio visualizer from vanilla JavaScript to Vue.js 3.

**Estimated Time**: 2-3 days of focused work (16-22 hours)
**Target Framework**: Vue.js 3 (Composition API)
**State Management**: Pinia (Vue's official state management)

---

## Phase 0: Preparation & Setup

### 0.1 Install Dependencies
```bash
npm install vue@^3.4.0 pinia@^2.1.0
npm install --save-dev @vitejs/plugin-vue vite
```

### 0.2 Project Structure
```
src/
├── main.js                 # Vue app entry point
├── App.vue                 # Root component
├── components/             # Vue components
│   ├── TitleBar.vue
│   ├── MenuBar.vue
│   ├── AudioPlayer.vue
│   ├── FileBrowser.vue
│   ├── SettingsPanel.vue
│   ├── QueuePanel.vue
│   ├── SpotifyPanel.vue
│   ├── YouTubePanel.vue
│   └── VisualizerCanvas.vue
├── stores/                 # Pinia stores
│   ├── audio.js
│   ├── ui.js
│   ├── visualizer.js
│   └── settings.js
├── composables/           # Vue composables
│   ├── useAudio.js
│   ├── useElectronIPC.js
│   └── useVisualizer.js
├── js/                    # Keep existing modules (gradually migrate)
│   ├── modules/           # Business logic (unchanged initially)
│   └── visualizers/       # Visualizer classes (unchanged initially)
└── styles.css             # Keep existing styles
```

### 0.3 Update Build Configuration
- Add Vite config for Vue
- Update Electron main process to load Vite dev server
- Configure build scripts

**Deliverable**: Vue app loads in Electron window

---

## Phase 1: Core Infrastructure (Day 1, Hours 1-3)

### 1.1 Setup Vue App
- [ ] Create `src/main.js` - Vue app initialization
- [ ] Create `src/App.vue` - Root component
- [ ] Setup Pinia stores structure
- [ ] Configure Vite for Electron

### 1.2 Electron Integration
- [ ] Create `composables/useElectronIPC.js` - IPC wrapper
- [ ] Setup IPC communication layer
- [ ] Test Electron APIs work with Vue

### 1.3 State Management Setup
- [ ] Create `stores/audio.js` - Audio state (current track, playing, volume, etc.)
- [ ] Create `stores/ui.js` - UI state (panels open/closed, modals, etc.)
- [ ] Create `stores/visualizer.js` - Visualizer state (current visualizer, settings)
- [ ] Create `stores/settings.js` - App settings

**Deliverable**: Vue app running with basic state management

---

## Phase 2: UI Components - Core (Day 1, Hours 4-6)

### 2.1 Title Bar Component
- [ ] Create `components/TitleBar.vue`
- [ ] Convert menu system (File, Edit, View, Playback, About)
- [ ] Handle window controls (minimize, maximize, close)
- [ ] Integrate with Electron IPC

### 2.2 Menu Bar Component
- [ ] Extract menu logic from `renderer.js`
- [ ] Convert to Vue component with dropdowns
- [ ] Handle keyboard shortcuts
- [ ] Test all menu actions

**Deliverable**: Title bar and menus working in Vue

---

## Phase 3: Audio Player UI (Day 1, Hours 7-8)

### 3.1 Audio Player Component
- [ ] Create `components/AudioPlayer.vue`
- [ ] Convert playback controls (play, pause, prev, next)
- [ ] Convert progress bar with seek functionality
- [ ] Convert volume slider
- [ ] Convert speed selector
- [ ] Convert shuffle/repeat buttons
- [ ] Connect to audio store

### 3.2 Now Playing Display
- [ ] Display current track info
- [ ] Display album art
- [ ] Display BPM/key info
- [ ] Volume history canvas (keep as-is initially)

**Deliverable**: Audio player fully functional in Vue

---

## Phase 4: Settings Panel (Day 2, Hours 1-2)

### 4.1 Settings Panel Component
- [ ] Create `components/SettingsPanel.vue`
- [ ] Convert settings modal
- [ ] Convert all setting controls (color pickers, sliders, dropdowns)
- [ ] Convert visualizer-specific settings
- [ ] Connect to settings store
- [ ] Persist settings to localStorage

**Deliverable**: Settings panel fully functional

---

## Phase 5: File Browser (Day 2, Hours 3-4)

### 5.1 File Browser Component
- [ ] Create `components/FileBrowser.vue`
- [ ] Convert file list rendering
- [ ] Convert folder browsing
- [ ] Convert search functionality
- [ ] Convert drag-and-drop
- [ ] Connect to file manager module (keep module as-is)

**Deliverable**: File browser fully functional

---

## Phase 6: Visualizer System (Day 2, Hours 5-6)

### 6.1 Visualizer Canvas Component
- [ ] Create `components/VisualizerCanvas.vue`
- [ ] Setup canvas/WebGL context
- [ ] Integrate existing visualizer classes (keep as-is)
- [ ] Handle visualizer switching
- [ ] Connect to visualizer store
- [ ] Setup animation loop

### 6.2 Visualizer Selector
- [ ] Convert visualizer dropdown
- [ ] Display visualizer list
- [ ] Handle visualizer change

**Deliverable**: Visualizers working with Vue wrapper

---

## Phase 7: Additional Panels (Day 2, Hours 7-8)

### 7.1 Queue Panel
- [ ] Create `components/QueuePanel.vue`
- [ ] Convert queue list
- [ ] Convert queue controls
- [ ] Connect to audio store

### 7.2 Spotify Panel
- [ ] Create `components/SpotifyPanel.vue`
- [ ] Convert Spotify UI
- [ ] Connect to Spotify integration module (keep as-is)

### 7.3 YouTube Panel
- [ ] Create `components/YouTubePanel.vue`
- [ ] Convert YouTube UI
- [ ] Connect to YouTube integration module (keep as-is)

**Deliverable**: All panels functional

---

## Phase 8: Integration & Refinement (Day 3, Hours 1-3)

### 8.1 Audio Integration
- [ ] Create `composables/useAudio.js`
- [ ] Integrate Web Audio API
- [ ] Connect analyser to visualizers
- [ ] Test audio playback and visualization

### 8.2 Module Integration
- [ ] Ensure all existing modules work with Vue
- [ ] Update module imports/exports if needed
- [ ] Test Discord RPC integration
- [ ] Test preset manager
- [ ] Test BPM/key detection

### 8.3 Event Handling
- [ ] Convert all event listeners to Vue
- [ ] Setup keyboard shortcuts
- [ ] Test all interactions

**Deliverable**: Full app functionality working

---

## Phase 9: Testing & Bug Fixes (Day 3, Hours 4-6)

### 9.1 Functional Testing
- [ ] Test audio playback
- [ ] Test all visualizers
- [ ] Test file browser
- [ ] Test settings persistence
- [ ] Test all integrations (Spotify, YouTube, Discord)

### 9.2 Performance Testing
- [ ] Check FPS for visualizers
- [ ] Check memory usage
- [ ] Optimize if needed

### 9.3 Bug Fixes
- [ ] Fix any regressions
- [ ] Fix any Vue-specific issues
- [ ] Ensure Electron IPC works correctly

**Deliverable**: Stable, fully functional Vue app

---

## Phase 10: Cleanup & Optimization (Day 3, Hours 7-8)

### 10.1 Code Cleanup
- [ ] Remove old DOM manipulation code from `renderer.js`
- [ ] Archive old `renderer.js` (rename to `renderer.js.old`)
- [ ] Clean up unused code
- [ ] Update documentation

### 10.2 Final Polish
- [ ] Ensure all styles work correctly
- [ ] Test on different screen sizes
- [ ] Final performance check
- [ ] Update README with Vue info

**Deliverable**: Clean, production-ready Vue codebase

---

## Migration Strategy

### Incremental Approach
1. **Keep existing modules unchanged** - Business logic stays in JS modules
2. **Wrap with Vue components** - UI layer becomes Vue components
3. **Gradual migration** - Convert one component at a time
4. **Test after each phase** - Ensure nothing breaks

### What Stays in Vanilla JS
- Visualizer classes (`src/js/visualizers/*.js`)
- Business logic modules (`src/js/modules/*.js`)
- Utility functions (`src/js/utils/*.js`)
- Audio processing logic

### What Becomes Vue
- All UI components
- State management
- Event handling
- DOM manipulation

---

## Key Files to Create

### Vue Components
1. `src/App.vue` - Root component
2. `src/components/TitleBar.vue` - Custom title bar
3. `src/components/MenuBar.vue` - Menu system
4. `src/components/AudioPlayer.vue` - Audio controls
5. `src/components/FileBrowser.vue` - File browser
6. `src/components/SettingsPanel.vue` - Settings
7. `src/components/QueuePanel.vue` - Queue
8. `src/components/SpotifyPanel.vue` - Spotify
9. `src/components/YouTubePanel.vue` - YouTube
10. `src/components/VisualizerCanvas.vue` - Canvas wrapper

### Pinia Stores
1. `src/stores/audio.js` - Audio state
2. `src/stores/ui.js` - UI state
3. `src/stores/visualizer.js` - Visualizer state
4. `src/stores/settings.js` - Settings state

### Composables
1. `src/composables/useAudio.js` - Audio logic
2. `src/composables/useElectronIPC.js` - IPC wrapper
3. `src/composables/useVisualizer.js` - Visualizer logic

### Configuration
1. `vite.config.js` - Vite configuration
2. `src/main.js` - Vue app entry
3. Update `package.json` scripts

---

## Testing Checklist

### Audio Functionality
- [ ] Play/pause works
- [ ] Next/previous track works
- [ ] Volume control works
- [ ] Speed control works
- [ ] Shuffle/repeat works
- [ ] Progress bar seeking works

### Visualizers
- [ ] All 20+ visualizers work
- [ ] Visualizer switching works
- [ ] Visualizer settings work
- [ ] Performance is maintained (60fps)

### File Management
- [ ] File browser works
- [ ] Folder browsing works
- [ ] Search works
- [ ] Drag-and-drop works
- [ ] File selection works

### Settings
- [ ] Settings panel opens/closes
- [ ] All settings save correctly
- [ ] Settings persist on reload
- [ ] Visualizer-specific settings work

### Integrations
- [ ] Spotify panel works
- [ ] YouTube panel works
- [ ] Discord RPC works
- [ ] Preset manager works

---

## Risk Mitigation

### Potential Issues
1. **Canvas/WebGL in Vue** - Solution: Use refs and lifecycle hooks
2. **Electron IPC** - Solution: Create composable wrapper
3. **Performance** - Solution: Keep visualizers as-is, just wrap
4. **State Management** - Solution: Use Pinia for reactive state
5. **Event Handling** - Solution: Convert to Vue event system

### Rollback Plan
- Keep old `renderer.js` as backup
- Use git branches for migration
- Test thoroughly before removing old code

---

## Success Criteria

✅ All existing features work
✅ No performance degradation
✅ Code is more maintainable
✅ Component-based architecture
✅ Reactive state management
✅ Better developer experience

---

## Next Steps After Migration

1. **TypeScript Migration** (Optional)
   - Add TypeScript for type safety
   - Migrate stores and components

2. **Component Library** (Optional)
   - Extract reusable components
   - Create component documentation

3. **Testing** (Optional)
   - Add unit tests for components
   - Add integration tests

---

## Notes

- This is an incremental migration - we don't need to convert everything at once
- Existing modules can stay as-is and be gradually migrated
- Visualizers can remain vanilla JS classes wrapped in Vue components
- Focus on UI layer first, business logic can follow later

---

**Ready to start?** Begin with Phase 0: Preparation & Setup!

