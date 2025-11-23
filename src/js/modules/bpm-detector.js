// BPM Detector Module - Handles BPM detection and beat timing
let guess = null;
try {
    const beatDetector = require('web-audio-beat-detector');
    guess = beatDetector.guess;
    console.log('BPM detection library loaded successfully');
} catch (error) {
    console.warn('BPM detection library not available:', error.message);
}

export class BPMDetector {
    constructor() {
        this.detectedBPM = 0;
        this.bpmOffset = 0; // Offset from start of track to first beat
        this.lastBeatFlash = 0;
        this.beatValue = 0;
        this.beatDecay = 0.95;
    }

    // Analyze BPM using web-audio-beat-detector library
    async analyze(audioBuffer) {
        if (!guess) {
            console.log('BPM detection not available');
            this.reset();
            return { success: false, bpm: 0 };
        }

        try {
            console.log('Analyzing BPM...');
            const result = await guess(audioBuffer);
            this.detectedBPM = Math.round(result.bpm);
            this.bpmOffset = result.offset || 0;
            this.lastBeatFlash = -1;
            console.log('✓ BPM detected:', this.detectedBPM, 'Offset:', this.bpmOffset.toFixed(3) + 's', 'Tempo:', result.tempo);
            return { success: true, bpm: this.detectedBPM, offset: this.bpmOffset, tempo: result.tempo };
        } catch (error) {
            console.error('BPM detection failed:', error);
            this.reset();
            return { success: false, bpm: 0, error: error.message };
        }
    }

    // Detect beat using BPM timing
    detectBeat(settings, isPlaying, audioContext, startTime) {
        if (!settings.beatDetection || this.detectedBPM === 0 || !isPlaying) {
            this.beatValue *= this.beatDecay;
            return false;
        }

        // Calculate current position in track
        const currentTime = audioContext.currentTime - startTime;

        // Calculate beat interval in seconds
        const beatInterval = 60 / this.detectedBPM;

        // Calculate time since track start, adjusted for offset
        const adjustedTime = currentTime - this.bpmOffset;

        // Find the nearest beat time
        const beatNumber = Math.floor(adjustedTime / beatInterval);
        const nextBeatTime = (beatNumber * beatInterval) + this.bpmOffset;
        const timeSinceLastBeat = currentTime - nextBeatTime;

        // Trigger flash if we just passed a beat (within 50ms window)
        if (timeSinceLastBeat >= 0 && timeSinceLastBeat < 0.05 && this.lastBeatFlash !== beatNumber) {
            this.lastBeatFlash = beatNumber;
            this.beatValue = 1.0;
            return true;
        }

        // Decay beat value using duration setting
        this.beatValue *= settings.beatFlashDuration;
        return false;
    }

    // Reset BPM data
    reset() {
        this.detectedBPM = 0;
        this.bpmOffset = 0;
        this.lastBeatFlash = 0;
        this.beatValue = 0;
    }

    // Set BPM manually (e.g., from Spotify)
    setBPM(bpm, offset = 0) {
        this.detectedBPM = Math.round(bpm);
        this.bpmOffset = offset;
        this.lastBeatFlash = -1;
        console.log('BPM set manually:', this.detectedBPM);
    }

    // Get current BPM
    getBPM() {
        return this.detectedBPM;
    }

    // Get beat value for visualization
    getBeatValue() {
        return this.beatValue;
    }
}
