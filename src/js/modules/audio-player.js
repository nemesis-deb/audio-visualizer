// Audio Player - handles audio playback
class AudioPlayer {
    constructor(audioContext, analyser, gainNode) {
        this.audioContext = audioContext;
        this.analyser = analyser;
        this.gainNode = gainNode;
        this.audioSource = null;
        this.audioBuffer = null;
        this.startTime = 0;
        this.pauseTime = 0;
        this.isPlaying = false;
    }

    async loadFile(filePath) {
        try {
            const arrayBuffer = await window.require('fs').promises.readFile(filePath);
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.buffer);
            return this.audioBuffer;
        } catch (error) {
            console.error('Error loading audio file:', error);
            throw error;
        }
    }

    play() {
        if (!this.audioBuffer) return false;

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Stop current source if playing
        if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource.disconnect();
        }

        // Create new source
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        this.audioSource.playbackRate.value = this.playbackRate || 1.0;
        
        // Connect: source -> gain -> analyser -> destination
        this.audioSource.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        // Start playback
        const offset = this.pauseTime || 0;
        this.audioSource.start(0, offset);
        this.startTime = this.audioContext.currentTime - offset;
        this.isPlaying = true;

        return true;
    }

    pause() {
        if (!this.audioSource || !this.isPlaying) return false;

        this.pauseTime = this.audioContext.currentTime - this.startTime;
        this.audioSource.stop();
        this.audioSource.disconnect();
        this.audioSource = null;
        this.isPlaying = false;

        return true;
    }

    stop() {
        if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource.disconnect();
            this.audioSource = null;
        }
        this.isPlaying = false;
        this.pauseTime = 0;
        this.startTime = 0;
    }

    getCurrentTime() {
        if (!this.isPlaying) return this.pauseTime;
        return this.audioContext.currentTime - this.startTime;
    }

    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }

    seek(time) {
        const wasPlaying = this.isPlaying;
        if (wasPlaying) {
            this.pause();
        }
        this.pauseTime = time;
        if (wasPlaying) {
            this.play();
        }
    }

    setVolume(volume) {
        this.gainNode.gain.value = volume;
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        if (this.audioSource) {
            this.audioSource.playbackRate.value = rate;
        }
    }

    onEnded(callback) {
        if (this.audioSource) {
            this.audioSource.onended = callback;
        }
    }
}

module.exports = AudioPlayer;
