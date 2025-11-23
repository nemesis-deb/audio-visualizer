// UI Controller - handles all DOM interactions
class UIController {
    constructor() {
        this.elements = this.cacheElements();
    }

    cacheElements() {
        return {
            // Playback controls
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            shuffleBtn: document.getElementById('shuffleBtn'),
            repeatBtn: document.getElementById('repeatBtn'),
            
            // Volume and speed
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            speedSelect: document.getElementById('speedSelect'),
            
            // Progress
            progressBar: document.getElementById('progressBar'),
            progressFill: document.getElementById('progressFill'),
            progressHandle: document.getElementById('progressHandle'),
            currentTime: document.getElementById('currentTime'),
            duration: document.getElementById('duration'),
            
            // Now playing
            nowPlayingTitle: document.getElementById('nowPlayingTitle'),
            nowPlayingArtist: document.getElementById('nowPlayingArtist'),
            status: document.getElementById('status'),
            bpmDisplay: document.getElementById('bpmDisplay'),
            
            // File browser
            fileBrowser: document.getElementById('fileBrowser'),
            browseFolderBtn: document.getElementById('browseFolderBtn'),
            searchInput: document.getElementById('searchInput'),
            folderPath: document.getElementById('folderPath'),
            fileCount: document.getElementById('fileCount'),
            includeSubfoldersCheckbox: document.getElementById('includeSubfoldersCheckbox'),
            
            // Queue
            queueBtn: document.getElementById('queueBtn'),
            queuePanel: document.getElementById('queuePanel'),
            closeQueueBtn: document.getElementById('closeQueueBtn'),
            queueList: document.getElementById('queueList'),
            
            // Settings
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            
            // Visualizer
            visualizerSelect: document.getElementById('visualizerSelect'),
            visualizerTweaksPanel: document.getElementById('visualizerTweaksPanel'),
            visualizerTweaksContent: document.getElementById('visualizerTweaksContent')
        };
    }

    updateNowPlaying(title, artist = '') {
        this.elements.nowPlayingTitle.textContent = title;
        this.elements.nowPlayingArtist.textContent = artist;
    }

    updateProgress(current, total) {
        const percentage = (current / total) * 100;
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressHandle.style.left = `${percentage}%`;
    }

    updateTime(current, total) {
        this.elements.currentTime.textContent = this.formatTime(current);
        this.elements.duration.textContent = this.formatTime(total);
    }

    updateBPM(bpm) {
        this.elements.bpmDisplay.textContent = bpm > 0 ? `${Math.round(bpm)} BPM` : '-- BPM';
    }

    updateStatus(text) {
        this.elements.status.textContent = text;
    }

    updateFileCount(count) {
        this.elements.fileCount.textContent = `${count} file${count !== 1 ? 's' : ''}`;
    }

    formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    enableControls() {
        this.elements.playBtn.disabled = false;
        this.elements.pauseBtn.disabled = false;
        this.elements.prevBtn.disabled = false;
        this.elements.nextBtn.disabled = false;
    }

    disableControls() {
        this.elements.playBtn.disabled = true;
        this.elements.pauseBtn.disabled = true;
        this.elements.prevBtn.disabled = true;
        this.elements.nextBtn.disabled = true;
    }

    toggleShuffle(active) {
        this.elements.shuffleBtn.classList.toggle('active', active);
    }

    updateRepeatButton(mode) {
        const btn = this.elements.repeatBtn;
        btn.classList.toggle('active', mode !== 'off');
        
        const titles = {
            'off': 'Repeat Off',
            'one': 'Repeat One',
            'all': 'Repeat All'
        };
        btn.title = titles[mode] || 'Repeat Off';
    }

    showQueue() {
        this.elements.queuePanel.classList.remove('hidden');
    }

    hideQueue() {
        this.elements.queuePanel.classList.add('hidden');
    }

    showSettings() {
        this.elements.settingsModal.classList.remove('hidden');
    }

    hideSettings() {
        this.elements.settingsModal.classList.add('hidden');
    }
}

module.exports = UIController;
