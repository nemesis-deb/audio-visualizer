// Discord RPC Module - Handles Discord Rich Presence updates
const { ipcRenderer } = require('electron');
import { CoverArtFetcher } from './cover-art-fetcher.js';

export class DiscordRPC {
    constructor() {
        this.enabled = true;
        this.lastSongPath = null;
        this.lastPlayState = false;
        this.cachedEndTimestamp = null;
        this.startTimestamp = null;
        this.coverArtFetcher = new CoverArtFetcher();
        this.currentCoverUrl = null;
    }

    // Update Discord Rich Presence (async to wait for cover art)
    async updatePresence(data) {
        if (!this.enabled) return;

        const {
            visualizerName = 'Waveform',
            currentFile = null,
            isPlaying = false,
            audioBuffer = null,
            audioContext = null,
            startTime = 0,
            parseFileName = null,
            metadata = null
        } = data;

        // No song playing
        if (!currentFile) {
            this.lastSongPath = null;
            this.lastPlayState = false;
            this.cachedEndTimestamp = null;
            this.currentCoverUrl = null;
            ipcRenderer.send('update-discord-presence', {
                details: 'No song playing',
                state: `Using ${visualizerName}`,
                largeImageKey: 'audio_file',
                smallImageKey: 'icon',
                smallImageText: 'Spectra 1.1.0'
            });
            return;
        }

        // Use metadata if available, otherwise parse filename
        let title;
        let artist;
        let album;
        
        if (metadata && (metadata.title || metadata.artist)) {
            title = metadata.title || (parseFileName ? parseFileName(currentFile.name).title : currentFile.name);
            artist = metadata.artist;
            album = metadata.album;
        } else {
            // Fallback to filename parsing
            const parsed = parseFileName ? parseFileName(currentFile.name) : { title: currentFile.name, hasArtist: false };
            title = parsed.title;
            artist = parsed.hasArtist ? parsed.artist : null;
            album = null;
        }

        // Get file extension for container format
        const fileExtension = currentFile.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';

        // Calculate timestamps
        let timestamps = null;
        if (audioBuffer && audioContext) {
            const songChanged = this.lastSongPath !== currentFile.path;
            const playStateChanged = this.lastPlayState !== isPlaying;

            if (songChanged || playStateChanged || !this.cachedEndTimestamp) {
                const currentTime = isPlaying ? (audioContext.currentTime - startTime) : 0;
                const duration = audioBuffer.duration;
                const startTimeMs = Date.now() - (currentTime * 1000);
                const endTimeMs = startTimeMs + (duration * 1000);
                
                this.cachedEndTimestamp = endTimeMs;
                this.startTimestamp = startTimeMs;
            }

            // Always calculate both start and end timestamps
            const startTs = Math.floor(this.startTimestamp / 1000);
            const endTs = Math.floor(this.cachedEndTimestamp / 1000);
            
            // The pause status will determine which ones to use in main.js
            timestamps = {
                start: startTs,
                end: endTs
            };
        }

        // Update tracking variables
        this.lastSongPath = currentFile.path;
        this.lastPlayState = isPlaying;

        // Fetch cover art if metadata is available (async)
        let coverArtUrl = null;
        if (metadata && (metadata.artist || metadata.album)) {
            try {
                coverArtUrl = await this.coverArtFetcher.getCoverArtUrl(metadata);
                this.currentCoverUrl = coverArtUrl;
            } catch (err) {
                console.error('Error fetching cover art:', err);
                this.currentCoverUrl = null;
            }
        }

        // Build YouTube search URL for button
        const searchQuery = artist && title ? `${artist} ${title}` : title;
        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

        // Send presence update with all data
        ipcRenderer.send('update-discord-presence', {
            details: title || 'Unknown Title',
            state: artist || null,
            timestamps: timestamps,
            pauseStatus: isPlaying ? 'no' : 'yes',
            containerFormat: fileExtension,
            largeImageUrl: coverArtUrl, // Will be used as large_image if available
            largeImageKey: coverArtUrl ? undefined : 'audio_file', // Fallback to default
            largeImageText: isPlaying ? fileExtension : `Paused - ${fileExtension}`,
            smallImageKey: 'icon',
            smallImageText: 'Spectra 1.1.0',
            youtubeUrl: youtubeUrl
        });
    }

    // Clear presence
    clearPresence() {
        this.currentCoverUrl = null;
        ipcRenderer.send('update-discord-presence', {
            details: 'Idle',
            state: 'No song playing',
            largeImageKey: 'audio_file',
            smallImageKey: 'icon',
            smallImageText: 'Spectra 1.1.0'
        });
    }

    // Enable/disable Discord RPC
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearPresence();
        }
    }
}
