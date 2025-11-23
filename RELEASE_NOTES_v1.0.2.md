# Spectra v1.0.2 Release Notes

## 🎉 What's New

### 🎵 Key Detection (Phase 12)
- **Musical key detection** with Krumhansl-Schmuckler chromagram analysis
- **Camelot notation** (8B, 5A, etc.) - perfect for DJs!
- Toggle between Camelot and standard notation (C major, A minor)
- Live key display next to BPM
- Spotify integration for automatic key detection
- Optimized algorithm (analyzes first 30 seconds, non-blocking)

### 🎨 Preset System
- **Save and load visualizer configurations** as `.spk` files
- 8 included demo presets:
  - Vocal Focus Starfield
  - Bass Heavy Radial
  - Chill Vibes Particles
  - Psychedelic Kaleidoscope
  - Retro Wave Spectrum
  - Minimal Waveform
  - Hi-Hat Focus Starfield
  - DJ Mode Circular
- Portable JSON format - share presets with friends!
- Windows file association with custom icon

### ✨ Starfield Visualizer Enhancements
- **Vocal-reactive center halo** that pulses with vocals/leads
- Customizable frequency range (Halo Freq Start/End %)
- Adjustable halo intensity (0-2x multiplier)
- Perfect for tuning to vocals, synths, hi-hats, or any frequency

### 🎛️ UI/UX Improvements
- **Custom styled sliders** with neon green glow effects
- Smooth hover animations and visual feedback
- **Folder grouping** when loading subfolders
- Collapsible folder headers with song counts
- Visual hierarchy with indented subfolder files
- Preset buttons moved to visualizer panel (easier access)
- Developer setting: Open DevTools on startup

### 🐛 Bug Fixes
- Fixed Spotify DRM errors (removed Web Playback SDK)
- Suppressed GPU-related console warnings
- Fixed file selection highlighting in grouped folders
- Improved slider visibility in dark panels
- Corrected visualizer manager methods for preset loading

## 📦 Installation

### Windows
- Download `Spectra-Setup-1.0.2.exe` for installer
- Or download `Spectra-1.0.2-win.exe` for portable version

### macOS
- Download `Spectra-1.0.2.dmg`
- Drag to Applications folder

### Linux
- Download `Spectra-1.0.2.AppImage` (universal)
- Or download `Spectra-1.0.2.deb` (Debian/Ubuntu)

## 🎯 Key Features

- **13 visualizers** including WebGL-powered 3D effects
- **BPM & Key detection** with live display
- **Beat-reactive effects** with customizable intensity
- **Spotify integration** for metadata and playlists
- **Discord Rich Presence** to show what you're listening to
- **GPU acceleration** for smooth 60 FPS visuals
- **Preset system** to save and share your favorite configs
- **Folder grouping** for organized music libraries
- **Custom sliders** with beautiful neon aesthetics

## 🔧 System Requirements

- **Windows**: 10 or later (64-bit)
- **macOS**: 10.13 High Sierra or later
- **Linux**: Ubuntu 18.04+ or equivalent
- **RAM**: 4GB minimum, 8GB recommended
- **GPU**: Any modern GPU with OpenGL 3.3+ support

## 📝 Supported Audio Formats

MP3, WAV, OGG, FLAC, M4A, AAC, WMA

## 🆕 Upgrade Notes

If upgrading from v1.0.1:
- Your settings will be preserved
- New Camelot notation setting defaults to ON
- DevTools setting defaults to OFF
- Try the new preset system!

## 🐛 Known Issues

- Spotify integration is metadata-only (no direct playback due to DRM)
- Key detection works best with clear harmonic content
- Some GPU drivers may show warnings in console (harmless)

## 🙏 Credits

Built with Electron, Three.js, and Web Audio API

## 📄 License

MIT License - See LICENSE file for details

---

**Full Changelog**: https://github.com/yourusername/spectra/compare/v1.0.1...v1.0.2
