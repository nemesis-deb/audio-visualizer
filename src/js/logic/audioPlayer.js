/**
 * Audio Player - Handles audio playback and state
 * Refactored to use EventEmitter pattern like Amethyst
 */
import { EventEmitter } from './eventEmitter.js';

/**
 * Audio Player - Handles audio playback and state
 * 
 * Events emitted:
 * - 'player:fileLoaded': { file, index, duration, buffer }
 * - 'player:play': { file, index }
 * - 'player:pause': { file, index }
 * - 'player:stop': undefined
 * - 'player:seek': { time }
 * - 'player:volumeChange': { volume }
 * - 'player:playbackRateChange': { rate }
 * - 'player:error': { error }
 */
export class AudioPlayer extends EventEmitter {
  constructor(audioContext, analyser, gainNode, dbGainNode = null) {
    super();
    
    this.audioContext = audioContext;
    this.analyser = analyser;
    this.gainNode = gainNode; // Volume gain node (output control)
    this.dbGainNode = dbGainNode; // DB gain node (visualizer intensity control)
    
    this.audioBuffer = null;
    this.audioSource = null;
    this.isPlaying = false;
    this.currentFileIndex = -1;
    this.audioFiles = [];
    this.startTime = 0;
    this.pauseTime = 0;
    this.manualStop = false;
    this.currentTime = 0;
    this.duration = 0;
    
    // Volume and playback rate
    this.volume = 1.0;
    this.playbackRate = 1.0;
    
    // Try to get fs module
    this.fs = null;
    if (typeof window !== 'undefined' && window.require) {
      try {
        this.fs = window.require('fs');
      } catch (e) {
        console.warn('[AudioPlayer] Failed to load fs module:', e);
      }
    }

    // Load saved volume
    const savedVolume = localStorage.getItem('audioVolume');
    if (savedVolume !== null) {
      this.setVolume(parseFloat(savedVolume));
    }
  }

  setAudioFiles(files) {
    this.audioFiles = files || [];
    console.log('[AudioPlayer] Audio files updated. Count:', this.audioFiles.length);
  }

  async loadFile(index) {
    console.log('[AudioPlayer] Loading file at index:', index);
    
    // Sync with window.audioFiles if available
    if (typeof window !== 'undefined' && window.audioFiles && Array.isArray(window.audioFiles)) {
      if (window.audioFiles.length !== this.audioFiles.length) {
        console.log('[AudioPlayer] Syncing files from window.audioFiles');
        this.setAudioFiles(window.audioFiles);
      }
    }
    
    // Validate index
    if (index < 0 || index >= this.audioFiles.length) {
      const error = new Error(`Invalid file index: ${index} (available: 0-${this.audioFiles.length - 1})`);
      console.error('[AudioPlayer]', error.message);
      this.emit('player:error', { error });
      throw error;
    }

    // Stop current playback if any
    if (this.audioSource && this.isPlaying) {
      this.manualStop = true;
      try {
        this.audioSource.stop();
      } catch (e) {
        console.warn('[AudioPlayer] Error stopping audio source:', e);
      }
      this.isPlaying = false;
    }

    this.currentFileIndex = index;
    const file = this.audioFiles[index];

    if (!file || !file.path) {
      const error = new Error('Invalid file object');
      console.error('[AudioPlayer]', error.message, file);
      this.emit('player:error', { error });
      throw error;
    }

    console.log('[AudioPlayer] Loading file:', file.name, 'from path:', file.path);

    try {
      if (!this.fs) {
        const error = new Error('File system module not available');
        console.error('[AudioPlayer]', error.message);
        this.emit('player:error', { error });
        throw error;
      }

      if (!this.fs.existsSync(file.path)) {
        const error = new Error('File does not exist: ' + file.path);
        console.error('[AudioPlayer]', error.message);
        this.emit('player:error', { error });
        throw error;
      }

      const buffer = this.fs.readFileSync(file.path);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.duration = this.audioBuffer.duration;
      this.currentTime = 0;
      this.pauseTime = 0;
      
      console.log('[AudioPlayer] Audio loaded successfully:', this.duration, 'seconds');

      // Emit file loaded event
      this.emit('player:fileLoaded', {
        file,
        index,
        duration: this.duration,
        buffer: this.audioBuffer
      });

      return this.audioBuffer;

    } catch (error) {
      console.error('[AudioPlayer] Error loading audio:', error);
      this.emit('player:error', { error });
      throw error;
    }
  }

  play() {
    if (!this.audioBuffer) {
      console.warn('[AudioPlayer] No audio buffer to play.');
      return false;
    }
    if (this.isPlaying) {
      console.warn('[AudioPlayer] Already playing.');
      return false;
    }

    // Stop any external audio (YouTube) that's currently playing
    if (window.audioManager && window.audioManager.externalAudio) {
      const externalAudio = window.audioManager.externalAudio;
      if (externalAudio && !externalAudio.paused) {
        console.log('[AudioPlayer] Stopping external audio (YouTube) before playing local file');
        externalAudio.pause();
        externalAudio.currentTime = 0;
      }
      // Clear external audio reference
      if (window.audioManager.clear) {
        window.audioManager.clear();
      }
      window.audioManager.externalAudio = null;
      window.audioManager.externalAudioSource = null;
    }
    
    // Clear YouTube video ID
    if (window.currentYouTubeVideoId) {
      window.currentYouTubeVideoId = null;
    }

    try {
      this.audioSource = this.audioContext.createBufferSource();
      this.audioSource.buffer = this.audioBuffer;
      this.audioSource.playbackRate.value = this.playbackRate;

      // Connect audio source -> dbGainNode -> analyser -> gainNode -> destination
      // Note: The connections are already set up in spectra.js during initialization
      // We just need to connect the source to the dbGainNode
      if (this.dbGainNode) {
        this.audioSource.connect(this.dbGainNode);
      } else {
        // Fallback: connect directly to analyser if dbGainNode not available
        this.audioSource.connect(this.analyser);
      }

      this.audioSource.onended = () => {
        if (this.manualStop) {
          this.manualStop = false;
          return;
        }
        // Handle natural end of song
        this.isPlaying = false;
        this.emit('player:pause', { file: this.audioFiles[this.currentFileIndex], index: this.currentFileIndex });
        console.log('[AudioPlayer] Playback ended naturally.');
      };

      const offset = this.pauseTime || 0;
      this.audioSource.start(0, offset);
      this.startTime = this.audioContext.currentTime - offset;
      this.pauseTime = 0;
      this.isPlaying = true;
      
      const file = this.audioFiles[this.currentFileIndex];
      this.emit('player:play', { file, index: this.currentFileIndex });
      
      console.log('[AudioPlayer] Playback started.');
      return true;
    } catch (error) {
      console.error('[AudioPlayer] Error playing audio:', error);
      this.emit('player:error', { error });
      return false;
    }
  }

  pause() {
    if (!this.isPlaying) return false;
    if (this.audioSource) {
      this.manualStop = true;
      this.audioSource.stop();
      this.pauseTime = this.audioContext.currentTime - this.startTime;
      this.isPlaying = false;
      
      const file = this.audioFiles[this.currentFileIndex];
      this.emit('player:pause', { file, index: this.currentFileIndex });
      
      console.log('[AudioPlayer] Playback paused.');
      return true;
    }
    return false;
  }

  stop() {
    if (this.audioSource && this.isPlaying) {
      this.manualStop = true;
      this.audioSource.stop();
      this.audioSource = null;
      this.pauseTime = 0;
      this.currentTime = 0;
      this.isPlaying = false;
      this.emit('player:stop', undefined);
      console.log('[AudioPlayer] Playback stopped.');
      return true;
    }
    return false;
  }

  seekTo(time) {
    if (this.audioBuffer) {
      const wasPlaying = this.isPlaying;
      this.stop();
      this.pauseTime = Math.max(0, Math.min(time, this.duration));
      this.currentTime = this.pauseTime;
      if (wasPlaying) {
        this.play();
      }
      this.emit('player:seek', { time: this.pauseTime });
      console.log('[AudioPlayer] Seeked to:', this.pauseTime);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    // Volume affects output gain node only (doesn't affect visualizer intensity)
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
    localStorage.setItem('audioVolume', this.volume.toString());
    this.emit('player:volumeChange', { volume: this.volume });
    console.log('[AudioPlayer] Volume set to:', this.volume);
  }

  setGainDB(gainDB) {
    // DB gain affects visualizer intensity (dbGainNode, before analyser)
    const clampedGain = Math.max(-24, Math.min(12, gainDB));
    if (this.dbGainNode) {
      const linearGain = Math.pow(10, clampedGain / 20); // Convert dB to linear
      this.dbGainNode.gain.value = linearGain;
      localStorage.setItem('audioGainDB', clampedGain.toString());
      console.log('[AudioPlayer] DB Gain set to:', clampedGain, 'dB (linear:', linearGain, ')');
    }
  }

  setPlaybackRate(rate) {
    this.playbackRate = Math.max(0.25, Math.min(4.0, rate));
    if (this.audioSource) {
      this.audioSource.playbackRate.value = this.playbackRate;
    }
    this.emit('player:playbackRateChange', { rate: this.playbackRate });
    console.log('[AudioPlayer] Playback rate set to:', this.playbackRate);
  }

  getCurrentTime() {
    if (this.isPlaying && this.audioSource) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pauseTime || 0;
  }

  getDuration() {
    return this.duration || 0;
  }

  getCurrentFile() {
    if (this.currentFileIndex >= 0 && this.currentFileIndex < this.audioFiles.length) {
      return this.audioFiles[this.currentFileIndex];
    }
    return null;
  }
}

