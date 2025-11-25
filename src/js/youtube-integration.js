/**
 * YouTube Integration for Spectra
 * Handles YouTube tab, search, and playback
 */

// Initialize immediately - don't wait for DOM
// The integration needs to be available as soon as possible
(function() {
    // Use IIFE to ensure this runs immediately when module loads
    console.log('[YouTube] Module loaded, initializing integration...');
    initYouTubeIntegration();
})();

function initYouTubeIntegration() {
    console.log('[YouTube] Initializing integration...');

    // YouTube instance
    let youtubeSearch = null;
    let youTubeAudio = null; // New YouTubeAudio instance
    let isYouTubeMode = false;
    let currentYouTubeVideoId = null;

    // API Key - load from .env or settings
    const YOUTUBE_API_KEY = 'AIzaSyBsMmyjyWaFGeziczXZrnWWJWCJC-rIyoI';

    // DOM Elements - get them safely (these may not exist in Vue app, that's OK)
    const youtubeTab = document.getElementById('youtubeTab');
    const youtubePanel = document.getElementById('youtubePanel');
    const youtubeSidebarSearch = document.getElementById('youtubeSidebarSearch');
    const youtubeSidebarSearchBtn = document.getElementById('youtubeSidebarSearchBtn');
    const youtubeResultsSidebar = document.getElementById('youtubeResultsSidebar');

    // Get elements from renderer (may not exist in Vue app)
    const localFilesTab = document.getElementById('localFilesTab');
    const spotifyTab = document.getElementById('spotifyTab');
    const spotifyPanel = document.getElementById('spotifyPanel');
    const searchInputWrapper = document.querySelector('.search-input-wrapper');
    const browseFolderBtn = document.getElementById('browseFolderBtn');
    const browseFolderBtnContainer = browseFolderBtn ? browseFolderBtn.parentElement : null;
    const fileBrowser = document.getElementById('fileBrowser');
    const playPauseBtn = document.getElementById('playPauseBtn');

    // Note: In Vue app, these DOM elements may not exist, but we can still initialize
    // the integration for programmatic use
    console.log('[YouTube] Initializing integration (DOM elements may not exist in Vue app)');

    // Wait for YouTubeSearch to be available, then initialize
    waitForYouTubeSearch();

    function waitForYouTubeSearch() {
        if (window.YouTubeSearch && window.YouTubeAudio) {
            console.log('[YouTube] YouTube classes found, initializing...');
            initializeYouTube().catch(err => {
                console.error('[YouTube] Error during initialization:', err);
            });
        } else {
            console.log('[YouTube] Waiting for YouTube classes... (YouTubeSearch:', !!window.YouTubeSearch, 'YouTubeAudio:', !!window.YouTubeAudio, ')');
            setTimeout(waitForYouTubeSearch, 100);
        }
    }
    
    // Also try to initialize immediately if classes are already available
    if (window.YouTubeSearch && window.YouTubeAudio) {
        console.log('[YouTube] Classes already available, initializing immediately...');
        initializeYouTube().catch(err => {
            console.error('[YouTube] Error during immediate initialization:', err);
        });
    }

    // Initialize YouTube
    async function initializeYouTube() {
        console.log('[YouTube] Initializing...');

        if (!window.YouTubeSearch || !window.YouTubeAudio) {
            console.error('[YouTube] Required classes not found');
            return;
        }

        // Initialize Search
        if (!youtubeSearch) {
            youtubeSearch = new window.YouTubeSearch();
            youtubeSearch.init(YOUTUBE_API_KEY);
        }

        // Initialize Audio Handler
        if (!youTubeAudio) {
            youTubeAudio = new window.YouTubeAudio();
        }

        console.log('[YouTube] Initialized successfully');
    }

    // YouTube Tab Click Handler (only if element exists)
    if (youtubeTab) {
        youtubeTab.addEventListener('click', () => {
            console.log('[YouTube] Tab clicked');

            // Update tab styles
            youtubeTab.classList.add('active');
            if (localFilesTab) localFilesTab.classList.remove('active');
            if (spotifyTab) spotifyTab.classList.remove('active');

            if (youtubeTab) {
                youtubeTab.style.background = '#00ff88';
                youtubeTab.style.color = '#000';
            }
            if (localFilesTab) {
                localFilesTab.style.background = '#444';
                localFilesTab.style.color = '#888';
            }
            if (spotifyTab) {
                spotifyTab.style.background = '#444';
                spotifyTab.style.color = '#888';
            }

            // Show/hide panels
            if (youtubePanel) youtubePanel.classList.remove('hidden');
            if (spotifyPanel) spotifyPanel.classList.add('hidden');
            if (searchInputWrapper) searchInputWrapper.classList.add('hidden');
            if (browseFolderBtnContainer) browseFolderBtnContainer.classList.add('hidden');

            isYouTubeMode = true;

            // Clear file browser
            if (fileBrowser) fileBrowser.innerHTML = '<div class="empty-state">Search YouTube to find videos</div>';

            // Initialize YouTube if not done yet
            if (!youtubeSearch) {
                initializeYouTube();
            }
        });
    }

    // Search YouTube
    async function searchYouTube(query = null) {
        // Get query from input if not provided
        if (!query && youtubeSidebarSearch) {
            query = youtubeSidebarSearch.value.trim();
        }
        
        if (!query) {
            console.warn('[YouTube] No search query provided');
            return;
        }

        console.log('[YouTube] Searching for:', query);

        // Initialize if not done yet
        if (!youtubeSearch) {
            console.log('[YouTube] Initializing before search...');
            await initializeYouTube();
        }

        if (!youtubeSearch) {
            if (youtubeResultsSidebar) {
                youtubeResultsSidebar.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #ff4444;">
                        YouTube not initialized. Please refresh the page.
                    </div>
                `;
            }
            return [];
        }

        // Show loading (only if element exists)
        if (youtubeResultsSidebar) {
            youtubeResultsSidebar.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #888;">
                    <div style="width: 30px; height: 30px; border: 3px solid rgba(255, 0, 0, 0.3); border-top-color: #FF0000; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                    Searching...
                </div>
            `;
        }

        try {
            const results = await youtubeSearch.searchVideos(query, 20);

            if (results.length === 0) {
                if (youtubeResultsSidebar) {
                    youtubeResultsSidebar.innerHTML = `
                        <div style="text-align: center; padding: 20px; color: #888;">
                            No results found
                        </div>
                    `;
                }
                return [];
            }

            // Display results (only if element exists)
            if (youtubeResultsSidebar) {
                displayYouTubeResults(results);
            }
            
            return results;

        } catch (error) {
            console.error('[YouTube] Search error:', error);
            if (youtubeResultsSidebar) {
                youtubeResultsSidebar.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #ff4444;">
                        Search failed. Check API key.
                    </div>
                `;
            }
            throw error;
        }
    }

    // Display YouTube results
    function displayYouTubeResults(results) {
        if (!youtubeResultsSidebar) {
            console.warn('[YouTube] Cannot display results - sidebar element not found');
            return;
        }
        youtubeResultsSidebar.innerHTML = results.map(video => `
            <div class="youtube-result-item" data-video-id="${video.id}" style="
                display: flex;
                gap: 10px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 0, 0, 0.2);
                border-radius: 5px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <img src="${video.thumbnail}" style="width: 120px; height: 68px; object-fit: cover; border-radius: 3px;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 13px; color: #fff; margin-bottom: 5px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4;">
                        ${video.title}
                    </div>
                    <div style="font-size: 11px; color: #999;">
                        ${video.channel}
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.youtube-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const videoId = item.dataset.videoId;
                playYouTubeVideo(videoId);
            });

            item.addEventListener('mouseenter', (e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#FF0000';
            });

            item.addEventListener('mouseleave', (e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.2)';
            });
        });
    }

    // Play YouTube video
    async function playYouTubeVideo(videoId, videoMetadata = null) {
        console.log('[YouTube] Playing video:', videoId);

        if (!youTubeAudio) {
            await initializeYouTube();
        }

        if (!youTubeAudio) {
            alert('YouTube Audio not initialized');
            return;
        }

        try {
            // Stop any local audio that's currently playing
            console.log('[YouTube] Stopping local audio before starting YouTube...');
            
            // Stop Spectra audio player
            if (window.spectra && window.spectra.audioPlayer) {
                if (window.spectra.audioPlayer.isPlaying) {
                    window.spectra.audioPlayer.pause();
                    console.log('[YouTube] Stopped Spectra audio player');
                }
            }
            
            // Stop AudioFileLoader if available
            if (window.audioFileLoader && window.audioFileLoader.isPlaying) {
                window.audioFileLoader.pause();
                console.log('[YouTube] Stopped AudioFileLoader');
            }
            
            // Stop legacy audio source
            if (window.audioSource) {
                try {
                    window.audioSource.stop();
                    console.log('[YouTube] Stopped legacy audio source');
                } catch (e) {
                    console.warn('[YouTube] Error stopping audio source:', e);
                }
            }
            
            // Stop any other audio elements
            const audioElement = document.getElementById('audioElement') || document.querySelector('audio');
            if (audioElement && !audioElement.paused) {
                audioElement.pause();
                console.log('[YouTube] Stopped audio element');
            }
            
            // Clear Discord RPC for local audio
            if (window.discordRPC && window.discordRPC.clearPresence) {
                // Don't clear completely, just prepare for YouTube update
                console.log('[YouTube] Preparing Discord RPC for YouTube');
            }

            // Update UI to show loading
            const nowPlayingTitle = document.getElementById('nowPlayingTitle');
            const nowPlayingArtist = document.getElementById('nowPlayingArtist');
            if (nowPlayingTitle) nowPlayingTitle.textContent = 'Loading YouTube Audio...';
            if (nowPlayingArtist) nowPlayingArtist.textContent = 'Please wait';

            // Create audio element using yt-dlp
            console.log('[YouTube] Fetching audio stream...');
            const { audio, metadata } = await youTubeAudio.createAudioElement(videoId);
            
            // Use provided metadata or metadata from audio, or try to get from YouTube API
            let finalMetadata = videoMetadata || metadata;
            if (!finalMetadata && youtubeSearch) {
                // Try to get metadata from search results if available
                try {
                    const searchResults = await youtubeSearch.searchVideos(videoId, 1);
                    if (searchResults && searchResults.length > 0) {
                        const video = searchResults.find(v => v.id === videoId);
                        if (video) {
                            finalMetadata = {
                                title: video.title,
                                channel: video.channel,
                                thumbnail: video.thumbnail
                            };
                        }
                    }
                } catch (e) {
                    console.warn('[YouTube] Could not get metadata from search:', e);
                }
            }
            
            currentYouTubeVideoId = videoId;
            // Store videoId on audio element for Discord RPC
            audio.dataset.videoId = videoId;
            window.currentYouTubeVideoId = videoId;
            console.log('[YouTube] Audio stream ready');

            // Connect to Audio Manager (Visualizer)
            if (window.audioManager) {
                console.log('[YouTube] Connecting to Audio Manager...');
                
                // Clear any previous external audio first
                if (window.audioManager.clear) {
                    window.audioManager.clear();
                }
                
                const success = window.audioManager.setAudioSource(audio);
                if (success) {
                    console.log('[YouTube] Connected to visualizer successfully');
                } else {
                    console.error('[YouTube] Failed to connect to visualizer');
                }
            }

            // Play audio
            try {
                await audio.play();
                console.log('[YouTube] Playback started');
                if (playPauseBtn) playPauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                
                // Update Discord RPC for YouTube video
                if (window.discordRPC && window.discordRPC.updateYouTubePresence) {
                    const title = finalMetadata?.title || metadata?.title || 'Unknown';
                    const channel = finalMetadata?.channel || metadata?.channel || 'YouTube';
                    const thumbnail = finalMetadata?.thumbnail || metadata?.thumbnail;
                    
                    // Set up periodic updates for time
                    const updateDiscordRPC = () => {
                        if (window.discordRPC && window.discordRPC.updateYouTubePresence && audio) {
                            window.discordRPC.updateYouTubePresence({
                                title: title,
                                artist: channel,
                                thumbnail: thumbnail,
                                isPlaying: !audio.paused,
                                currentTime: audio.currentTime || 0,
                                duration: audio.duration || 0,
                                videoId: videoId
                            });
                        }
                    };
                    
                    // Update immediately
                    updateDiscordRPC();
                    
                    // Update on timeupdate
                    audio.addEventListener('timeupdate', updateDiscordRPC);
                    audio.addEventListener('play', updateDiscordRPC);
                    audio.addEventListener('pause', updateDiscordRPC);
                    audio.addEventListener('loadedmetadata', updateDiscordRPC);
                }
            } catch (playError) {
                console.error('[YouTube] Playback failed:', playError);
                // Handle autoplay policy
            }

            // Update UI with metadata
            if (finalMetadata) {
                const title = finalMetadata.title || metadata?.title || 'Unknown';
                const channel = finalMetadata.channel || metadata?.channel || 'YouTube';
                const thumbnail = finalMetadata.thumbnail || metadata?.thumbnail;
                
                // Update DOM elements if they exist (legacy support)
                if (nowPlayingTitle) nowPlayingTitle.textContent = title;
                if (nowPlayingArtist) nowPlayingArtist.textContent = channel;
                
                const nowPlayingArt = document.getElementById('nowPlayingArt');
                if (nowPlayingArt && thumbnail) {
                    nowPlayingArt.innerHTML = `<img src="${thumbnail}" style="width: 100%; height: 100%; object-fit: cover;">`;
                }
                
                // Update Vue audio store if available
                // Try to access the store via window or Vue app
                let audioStore = null;
                try {
                    // Try window.audioStore first (set by useAudioIntegration)
                    if (window.audioStore) {
                        audioStore = window.audioStore;
                    } else {
                        // Try to get from Vue app
                        const app = document.querySelector('#app')?.__vue_app__;
                        if (app && app.config && app.config.globalProperties) {
                            // Store might be available via global properties
                            console.log('[YouTube] Vue app found');
                        }
                    }
                } catch (e) {
                    console.warn('[YouTube] Could not access audio store:', e);
                }
                
                if (audioStore) {
                    audioStore.setTitle(title);
                    audioStore.setArtist(channel);
                    if (thumbnail) {
                        audioStore.setAlbumArt(thumbnail);
                    }
                    // Set current track info
                    audioStore.setCurrentTrack({
                        title: title,
                        artist: channel,
                        album: 'YouTube',
                        path: `youtube:${videoId}`,
                        name: title
                    });
                    console.log('[YouTube] Updated audio store with metadata');
                } else {
                    console.warn('[YouTube] Audio store not available, metadata not updated');
                }
                
                // Update Discord RPC immediately with YouTube metadata
                if (window.discordRPC && window.discordRPC.updateYouTubePresence) {
                    window.discordRPC.updateYouTubePresence({
                        title: title,
                        artist: channel,
                        thumbnail: thumbnail,
                        isPlaying: !audio.paused,
                        currentTime: audio.currentTime || 0,
                        duration: audio.duration || 0,
                        videoId: videoId
                    });
                    console.log('[YouTube] Updated Discord RPC with YouTube metadata');
                }
            }

        } catch (error) {
            console.error('[YouTube] Playback error:', error);
            const nowPlayingTitle = document.getElementById('nowPlayingTitle');
            if (nowPlayingTitle) nowPlayingTitle.textContent = 'Error loading audio';
            alert('Failed to load YouTube audio. Please try another video.');
        }
    }

    // Event Listeners
    // Add event listeners only if elements exist
    if (youtubeSidebarSearchBtn) {
        youtubeSidebarSearchBtn.addEventListener('click', () => searchYouTube());
    }

    if (youtubeSidebarSearch) {
        youtubeSidebarSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchYouTube();
            }
        });
    }

    // Update playback controls for YouTube
    const originalPlayPause = window.playPause || function() {};
    
    // Override global play/pause
    window.playPause = function() {
        if (isYouTubeMode && youTubeAudio) {
            if (youTubeAudio.isPlaying()) {
                youTubeAudio.pause();
                if (playPauseBtn) playPauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
            } else {
                youTubeAudio.play();
                if (playPauseBtn) playPauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
            }
        } else {
            originalPlayPause();
        }
    };

    // Export for use in other modules IMMEDIATELY (before initialization)
    // This allows the integration to be used even if classes aren't ready yet
    window.youtubeIntegration = {
        initializeYouTube,
        searchYouTube,
        playYouTubeVideo,
        isYouTubeMode: () => isYouTubeMode,
        _initialized: false,
        _ready: () => youtubeSearch !== null && youTubeAudio !== null
    };
    
    // Also export the init function globally
    window.initYouTubeIntegration = initYouTubeIntegration;

    console.log('[YouTube] Integration object created and exported to window.youtubeIntegration');
    
    // Start waiting for classes and initializing
    waitForYouTubeSearch();

} // End of initYouTubeIntegration function

// Note: Initialization is handled at the top of the file
// This ensures the integration is always initialized
