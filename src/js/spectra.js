/**
 * Spectra - Main Application Initialization
 * Similar to Amethyst's amethyst.ts
 * 
 * This file initializes all core modules and provides a central access point
 */
import { FileManager } from './logic/fileManager.js';
import { AudioPlayer } from './logic/audioPlayer.js';
import { ElectronEventManager } from './logic/electronEventManager.js';
// VisualizerManager will be imported dynamically

// Export parseFileName for legacy compatibility
export function parseFileName(filename) {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  let cleaned = nameWithoutExt.replace(/^\d+[\s.-]*/, '');
  const separators = [' - ', ' – ', ' — '];
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep);
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(sep).trim(),
        hasArtist: true
      };
    }
  }
  return {
    artist: '',
    title: cleaned.trim(),
    hasArtist: false
  };
}

export class Spectra {
  constructor() {
    console.log('[Spectra] Initializing application...');
    
    // Initialize Electron IPC manager
    this.electron = new ElectronEventManager();
    
    // Initialize file manager
    this.fileManager = new FileManager();
    
    // Audio context and nodes will be initialized when ready
    this.audioContext = null;
    this.analyser = null;
    this.dbGainNode = null; // DB gain node (affects visualizer intensity, before analyser)
    this.gainNode = null; // Volume gain node (affects output only, after analyser)
    this.audioPlayer = null;
    
    // Visualizer manager
    this.visualizerManager = null;
    
    // State
    this.isInitialized = false;
    
    console.log('[Spectra] Application instance created');
  }

  /**
   * Initialize audio system
   */
  async initializeAudio() {
    if (this.audioContext) {
      console.log('[Spectra] Audio already initialized');
      return;
    }

    try {
      console.log('[Spectra] Initializing audio system...');
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive'
      });
      
      // Create DB gain node (affects visualizer intensity, before analyser)
      this.dbGainNode = this.audioContext.createGain();
      const savedGainDB = parseFloat(localStorage.getItem('audioGainDB')) || 0;
      this.dbGainNode.gain.value = Math.pow(10, savedGainDB / 20); // Convert dB to linear
      
      // Create analyser node (after DB gain, so it affects visualizer intensity)
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Create gain node for volume control (affects output only, after analyser)
      this.gainNode = this.audioContext.createGain();
      const savedVolume = parseFloat(localStorage.getItem('audioVolume')) || 1.0;
      this.gainNode.gain.value = savedVolume;
      
      // Connect: dbGainNode -> analyser -> gainNode -> destination
      this.dbGainNode.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      // Create audio player
      this.audioPlayer = new AudioPlayer(this.audioContext, this.analyser, this.gainNode, this.dbGainNode);
      
      // Set up event listeners
      this.setupAudioPlayerListeners();
      
      // Export to window for Vue components
      window.spectra = this;
      window.audioContext = this.audioContext;
      window.analyser = this.analyser;
      window.dbGainNode = this.dbGainNode; // Export DB gain node for gain controls
      window.gainNode = this.gainNode; // Export volume gain node for volume slider
      window.audioPlayer = this.audioPlayer;
      window.fileManager = this.fileManager;
      window.parseFileName = parseFileName;
      
      console.log('[Spectra] Audio system initialized successfully');
      
      return true;
    } catch (error) {
      console.error('[Spectra] Error initializing audio:', error);
      return false;
    }
  }

  /**
   * Setup audio player event listeners
   */
  setupAudioPlayerListeners() {
    if (!this.audioPlayer) return;

    // File loaded event
    this.audioPlayer.on('player:fileLoaded', async (data) => {
      console.log('[Spectra] File loaded:', data.file.name);
      
      // Update window.audioFiles if needed
      if (window.audioFiles) {
        window.audioFiles = this.fileManager.getAudioFiles();
      }
      
      // Analyze BPM and Key if detectors are available
      if (data.buffer && window.bpmDetector && window.keyDetector) {
        try {
          // Reset detectors
          window.bpmDetector.reset();
          window.keyDetector.reset();
          
          // Analyze BPM
          if (window.bpmDetector.analyze) {
            const bpmResult = await window.bpmDetector.analyze(data.buffer);
            if (bpmResult && bpmResult.success && bpmResult.bpm) {
              // Dispatch event for Vue components to update store
              window.dispatchEvent(new CustomEvent('bpm-detected', { 
                detail: { bpm: bpmResult.bpm } 
              }));
              console.log('[Spectra] BPM detected:', bpmResult.bpm);
            }
          }
          
          // Analyze Key
          if (window.keyDetector.analyze) {
            const keyResult = await window.keyDetector.analyze(data.buffer);
            if (keyResult && keyResult.success) {
              // Get notation format from localStorage or settings (default to camelot for backward compatibility)
              let notation = 'camelot';
              try {
                const savedSettings = localStorage.getItem('audioVisualizerSettings');
                if (savedSettings) {
                  const parsed = JSON.parse(savedSettings);
                  notation = parsed.keyNotation || (parsed.useCamelotNotation !== false ? 'camelot' : 'standard');
                } else {
                  // Check legacy setting
                  const useCamelot = localStorage.getItem('useCamelotNotation');
                  if (useCamelot === 'false') {
                    notation = 'standard';
                  }
                }
              } catch (e) {
                console.warn('[Spectra] Could not read key notation setting:', e);
              }
              
              // Get formatted key string based on notation preference
              const formattedKey = window.keyDetector.getKeyDisplay(notation);
              
              // Dispatch event for Vue components to update store
              window.dispatchEvent(new CustomEvent('key-detected', { 
                detail: { key: formattedKey, rawKey: keyResult.keyString } 
              }));
              console.log('[Spectra] Key detected:', formattedKey, `(${notation})`);
            }
          }
        } catch (error) {
          console.warn('[Spectra] Error analyzing BPM/Key:', error);
        }
      }
      
      // Update Discord RPC
      if (window.discordRPC && window.discordRPC.updatePresence) {
        try {
          const metadata = window.metadataCache?.get(data.file.path);
          await window.discordRPC.updatePresence({
            visualizerName: window.visualizerManager?.getCurrent()?.name || 'Waveform',
            currentFile: data.file,
            isPlaying: false,
            audioBuffer: data.buffer,
            audioContext: this.audioContext,
            startTime: 0,
            parseFileName: window.parseFileName,
            metadata: metadata
          });
        } catch (error) {
          console.warn('[Spectra] Error updating Discord RPC:', error);
        }
      }
      
      // Dispatch custom event for Vue components
      window.dispatchEvent(new CustomEvent('audio-file-loaded', { detail: data }));
    });

    // Playback state changes
    this.audioPlayer.on('player:play', async (data) => {
      console.log('[Spectra] Playback started:', data.file.name);
      
      // Update Discord RPC when playing
      if (window.discordRPC && window.discordRPC.updatePresence) {
        try {
          const metadata = window.metadataCache?.get(data.file.path);
          const currentTime = this.audioPlayer.getCurrentTime();
          await window.discordRPC.updatePresence({
            visualizerName: window.visualizerManager?.getCurrent()?.name || 'Waveform',
            currentFile: data.file,
            isPlaying: true,
            audioBuffer: this.audioPlayer.audioBuffer,
            audioContext: this.audioContext,
            startTime: this.audioContext.currentTime - currentTime,
            parseFileName: window.parseFileName,
            metadata: metadata
          });
        } catch (error) {
          console.warn('[Spectra] Error updating Discord RPC:', error);
        }
      }
      
      window.dispatchEvent(new CustomEvent('audio-play', { detail: data }));
    });

    this.audioPlayer.on('player:pause', (data) => {
      console.log('[Spectra] Playback paused');
      window.dispatchEvent(new CustomEvent('audio-pause', { detail: data }));
    });

    this.audioPlayer.on('player:stop', () => {
      console.log('[Spectra] Playback stopped');
      window.dispatchEvent(new CustomEvent('audio-stop'));
    });

    // Volume changes
    this.audioPlayer.on('player:volumeChange', (data) => {
      window.dispatchEvent(new CustomEvent('audio-volume-change', { detail: data }));
    });

    // Errors
    this.audioPlayer.on('player:error', (data) => {
      console.error('[Spectra] Audio player error:', data.error);
      window.dispatchEvent(new CustomEvent('audio-error', { detail: data }));
    });
  }

  /**
   * Initialize visualizer system
   */
  async initializeVisualizers() {
    // If visualizerManager was already set (e.g., by renderer-new.js), use it
    if (this.visualizerManager) {
      console.log('[Spectra] Visualizers already initialized');
      return true;
    }

    try {
      console.log('[Spectra] Initializing visualizer system...');
      
      // Import visualizer manager
      const { VisualizerManager } = await import('./modules/visualizer-manager.js');
      this.visualizerManager = new VisualizerManager();
      
      // Export to window only if not already set
      if (!window.visualizerManager) {
        window.visualizerManager = this.visualizerManager;
      } else {
        // Use the existing one from window
        this.visualizerManager = window.visualizerManager;
      }
      
      console.log('[Spectra] Visualizer system initialized');
      
      return true;
    } catch (error) {
      console.error('[Spectra] Error initializing visualizers:', error);
      return false;
    }
  }

  /**
   * Complete initialization
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[Spectra] Already initialized');
      return;
    }

    console.log('[Spectra] Starting complete initialization...');
    
    // Initialize audio
    const audioInitialized = await this.initializeAudio();
    if (!audioInitialized) {
      throw new Error('Failed to initialize audio system');
    }
    
    // Initialize visualizers
    const visualizersInitialized = await this.initializeVisualizers();
    if (!visualizersInitialized) {
      console.warn('[Spectra] Visualizers initialization failed, continuing anyway');
    }
    
    // Set up file manager listeners
    this.fileManager.on('folderLoaded', (data) => {
      console.log('[Spectra] Folder loaded:', data.folderPath, data.count, 'files');
      
      // Update audio player with new files
      if (this.audioPlayer) {
        this.audioPlayer.setAudioFiles(data.files);
      }
      
      // Update window for legacy compatibility
      window.audioFiles = data.files;
      window.currentFolder = data.folderPath;
      
      // Save last opened folder
      localStorage.setItem('lastOpenedFolder', data.folderPath);
      
      // Dispatch event for Vue components
      window.dispatchEvent(new CustomEvent('folder-loaded', { detail: data }));
    });

    // Load last opened folder if available
    const lastFolder = localStorage.getItem('lastOpenedFolder');
    if (lastFolder && this.fileManager.fs && this.fileManager.fs.existsSync) {
      try {
        if (this.fileManager.fs.existsSync(lastFolder)) {
          console.log('[Spectra] Loading last opened folder:', lastFolder);
          setTimeout(() => {
            this.fileManager.loadFolder(lastFolder);
          }, 500);
        }
      } catch (e) {
        console.warn('[Spectra] Could not load last folder:', e);
      }
    }

    this.isInitialized = true;
    console.log('[Spectra] Initialization complete');
  }

  /**
   * Load audio file
   */
  async loadFile(index) {
    if (!this.audioPlayer) {
      throw new Error('Audio player not initialized');
    }
    return await this.audioPlayer.loadFile(index);
  }

  /**
   * Play audio
   */
  play() {
    if (!this.audioPlayer) {
      console.warn('[Spectra] Audio player not initialized');
      return false;
    }
    return this.audioPlayer.play();
  }

  /**
   * Pause audio
   */
  pause() {
    if (!this.audioPlayer) {
      console.warn('[Spectra] Audio player not initialized');
      return false;
    }
    return this.audioPlayer.pause();
  }

  /**
   * Stop audio
   */
  stop() {
    if (!this.audioPlayer) {
      console.warn('[Spectra] Audio player not initialized');
      return false;
    }
    return this.audioPlayer.stop();
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume) {
    if (!this.audioPlayer) {
      console.warn('[Spectra] Audio player not initialized');
      return;
    }
    this.audioPlayer.setVolume(volume);
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate) {
    if (!this.audioPlayer) {
      console.warn('[Spectra] Audio player not initialized');
      return;
    }
    this.audioPlayer.setPlaybackRate(rate);
  }
}

// Create and export singleton instance
export const spectra = new Spectra();

// Export to window for global access
if (typeof window !== 'undefined') {
  window.spectra = spectra;
}

