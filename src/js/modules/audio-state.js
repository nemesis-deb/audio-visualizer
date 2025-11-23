// Audio State Management
class AudioState {
    constructor() {
        this.audioBuffer = null;
        this.audioSource = null;
        this.isPlaying = false;
        this.currentFolder = '';
        this.audioFiles = [];
        this.currentFileIndex = -1;
        this.searchQuery = '';
        this.startTime = 0;
        this.pauseTime = 0;
        this.animationFrameId = null;
        this.shuffleMode = false;
        this.repeatMode = 'off'; // 'off', 'one', 'all'
        this.playbackRate = 1.0;
        this.volume = 1.0;
        this.gainNode = null;
        this.playbackQueue = [];
        this.manualStop = false;
        this.includeSubfolders = localStorage.getItem('includeSubfolders') === 'true' || false;
    }

    reset() {
        this.audioBuffer = null;
        this.audioSource = null;
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.manualStop = false;
    }

    getCurrentFile() {
        return this.audioFiles[this.currentFileIndex];
    }

    getFilteredFiles() {
        if (!this.searchQuery) return this.audioFiles;
        const query = this.searchQuery.toLowerCase();
        return this.audioFiles.filter(file => 
            file.name.toLowerCase().includes(query) || 
            (file.artist && file.artist.toLowerCase().includes(query))
        );
    }
}

module.exports = AudioState;
