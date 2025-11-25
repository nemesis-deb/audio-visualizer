# Vue Migration Testing Checklist

## Phase 9: Comprehensive Testing and Bug Fixes

### Critical Integration Points to Test

#### 1. Application Startup
- [ ] App loads without errors
- [ ] Vue app mounts correctly
- [ ] renderer.js initializes before Vue components
- [ ] All global objects (window.audioManager, window.visualizerManager) are available
- [ ] No console errors on startup

#### 2. TitleBar Component
- [ ] Window controls (minimize, maximize, close) work
- [ ] App icon displays correctly
- [ ] MenuBar appears and functions
- [ ] Window state updates correctly (maximized/unmaximized)

#### 3. MenuBar Component
- [ ] All menu items appear
- [ ] Dropdowns open/close correctly
- [ ] Menu actions trigger correctly
- [ ] Keyboard shortcuts work
- [ ] Settings menu opens SettingsPanel

#### 4. AudioPlayer Component
- [ ] Play/Pause buttons work
- [ ] Previous/Next track buttons work
- [ ] Progress bar displays and seeks correctly
- [ ] Volume slider updates volume
- [ ] Playback speed selector works
- [ ] Shuffle/Repeat toggles work
- [ ] Time display updates correctly
- [ ] Album art displays
- [ ] Gain controls (+/- 3dB) work
- [ ] Volume history canvas renders
- [ ] BPM and Key display correctly
- [ ] Queue button opens QueuePanel

#### 5. SettingsPanel Component
- [ ] Opens/closes correctly
- [ ] All categories display (Appearance, Performance, etc.)
- [ ] Color theme selector works
- [ ] Custom color picker appears when "Custom" is selected
- [ ] Background color picker works
- [ ] Line width, smoothing, sensitivity sliders work
- [ ] Mirror effect checkbox works
- [ ] Canvas resolution selector works
- [ ] Custom resolution inputs work
- [ ] GPU acceleration checkbox works
- [ ] FPS cap selector works
- [ ] Beat detection settings work
- [ ] Camelot notation toggle works
- [ ] Album art background toggle works
- [ ] DevTools on startup checkbox works
- [ ] Visualizer settings panel updates dynamically
- [ ] Settings persist to localStorage
- [ ] Theme changes apply immediately

#### 6. VisualizerCanvas Component
- [ ] Canvas initializes with correct dimensions
- [ ] Visualizer renders correctly
- [ ] Animation loop runs smoothly
- [ ] FPS cap works when set
- [ ] Canvas resolution changes apply correctly
- [ ] Fullscreen button works
- [ ] Visualizers initialize correctly
- [ ] Audio data flows to visualizers

#### 7. VisualizerPanel Component
- [ ] Visualizer selector dropdown populates
- [ ] Visualizer switching works
- [ ] Custom settings panel displays for each visualizer
- [ ] Range/select/checkbox inputs work
- [ ] Preset save/load buttons work
- [ ] Status message displays

#### 8. QueuePanel Component
- [ ] Opens/closes correctly
- [ ] Queue list displays all tracks
- [ ] Current track is highlighted
- [ ] Clicking a track plays it
- [ ] Album art loads for queue items
- [ ] Empty state displays when queue is empty

#### 9. SpotifyPanel Component
- [ ] Login button works
- [ ] Connection state displays correctly
- [ ] Search functionality works
- [ ] Search results display
- [ ] Playing tracks from Spotify works
- [ ] Disconnect button works

#### 10. YouTubePanel Component
- [ ] Search input works
- [ ] Search results display with thumbnails
- [ ] Video duration formats correctly
- [ ] Playing videos works
- [ ] YouTube audio connects to visualizer

#### 11. Audio System Integration
- [ ] Audio files load correctly
- [ ] Playback works for local files
- [ ] Playback works for YouTube videos
- [ ] Playback works for Spotify tracks
- [ ] Audio context initializes
- [ ] Analyser node provides data
- [ ] Volume control affects output
- [ ] Gain control affects visualizers
- [ ] Playback rate changes work
- [ ] Seeking works
- [ ] Track metadata loads (title, artist, album)
- [ ] Album art loads
- [ ] BPM detection works
- [ ] Key detection works
- [ ] Discord RPC updates

#### 12. State Management
- [ ] Audio store updates correctly
- [ ] UI store updates correctly
- [ ] Visualizer store updates correctly
- [ ] Settings store persists correctly
- [ ] State syncs between Vue and global variables
- [ ] No state desynchronization

#### 13. IPC Communication
- [ ] Electron IPC works correctly
- [ ] Menu actions trigger IPC events
- [ ] File dialogs work
- [ ] Window controls communicate with main process

#### 14. Performance
- [ ] No memory leaks
- [ ] Animation loop doesn't lag
- [ ] UI remains responsive during playback
- [ ] Large file lists don't cause slowdowns
- [ ] Visualizer switching is smooth

#### 15. Error Handling
- [ ] Errors are caught and logged
- [ ] App doesn't crash on invalid input
- [ ] Missing files are handled gracefully
- [ ] Network errors (Spotify/YouTube) are handled

### Known Issues to Fix

1. **renderer.js Import**: renderer.js uses CommonJS but is imported as ES module
   - Solution: May need to use dynamic import or convert renderer.js to ES modules

2. **State Synchronization**: Window variables may not always sync with Vue stores
   - Solution: Ensure syncStateToWindow() is called on all state changes

3. **Canvas Initialization**: Canvas may not be ready when visualizers initialize
   - Solution: Wait for canvas ref in VisualizerCanvas component

4. **Volume History**: Volume history canvas may not initialize correctly
   - Solution: Ensure canvas exists before initializing VolumeHistoryVisualizer

### Testing Commands

```bash
# Start Electron app
npm start

# Start Vite dev server (for development)
npm run dev

# Build for production
npm run build
```

### Common Issues and Solutions

1. **"Cannot find module" errors**: Ensure all imports use correct paths
2. **"window is not defined"**: Check Electron context isolation settings
3. **"require is not defined"**: Use window.require in Electron renderer
4. **State not updating**: Check watchers and polling intervals
5. **Visualizer not rendering**: Ensure analyser is connected and providing data

