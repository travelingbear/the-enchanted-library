
class SoundNovelSPA {
    constructor() {
        this.settings = {
            musicMode: 'enabled',
            effectsEnabled: true,
            musicLoop: true,
            musicVolume: 10,
            effectsVolume: 20,
            autoBookmark: false,
            fontSize: 16,
            fontFamily: 'serif',
            textColor: '#ffffff',
            bgOpacity: 80
        };
        
        this.disabledChapters = new Set();
        
        this.currentChapter = null;
        this.chaptersData = {};
        this.loadedAssets = new Set();
        
        this.loadSettings();
        this.initializeApp();
    }
    
    async initializeApp() {
        await this.loadChaptersData();
        this.setupEventListeners();
        this.setupRouting();
        this.applySettings();
        this.updateToggleButtons();
        this.checkBookmark();
        this.initFrontPageAnimation(false);
    }
    
    async loadChaptersData() {
        try {
            const response = await fetch('chapters.json');
            this.chaptersData = await response.json();
        } catch (error) {
            console.error('Failed to load chapters data:', error);
        }
    }
    
    setupRouting() {
        // Handle initial route
        this.handleRoute();
        
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });
        
        // Handle chapter card clicks
        document.querySelectorAll('.chapter-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const chapter = card.dataset.chapter;
                this.navigateToChapter(parseInt(chapter));
            });
        });
        
        // Handle author link
        document.querySelector('.author-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToAbout();
        });
    }
    
    handleRoute() {
        const hash = window.location.hash;
        
        if (hash.startsWith('#chapter-')) {
            const chapterNum = parseInt(hash.replace('#chapter-', ''));
            this.showChapter(chapterNum);
        } else if (hash === '#about-author') {
            this.showAbout();
        } else {
            this.showFrontPage();
        }
    }
    
    navigateToChapter(chapterNum) {
        window.location.hash = `#chapter-${chapterNum}`;
    }
    
    navigateToAbout() {
        window.location.hash = '#about-author';
    }
    
    navigateToHome() {
        window.location.hash = '';
    }
    
    showFrontPage() {
        this.hideAllPages();
        const frontPage = document.getElementById('front-page');
        frontPage.classList.remove('hidden');
        frontPage.classList.add('active');
        frontPage.scrollTop = 0;
        this.currentChapter = null;
        
        // Restore front page background
        this.setFrontPageBackground();
        
        // Update settings button style
        const settingsBtn = document.getElementById('settings-toggle');
        if (settingsBtn) {
            settingsBtn.style.borderRadius = '50%';
        }
        
        // Reload bookmark info
        this.reloadBookmarkInfo();
    }
    
    async showChapter(chapterNum) {
        if (!this.chaptersData[chapterNum]) return;
        
        this.hideAllPages();
        
        const chapterContainer = document.getElementById('chapter-container');
        const chapterContent = document.getElementById('chapter-content');
        
        // Scroll the chapter container to top
        chapterContainer.scrollTop = 0;
        
        // Load chapter content but keep container hidden
        chapterContent.innerHTML = this.chaptersData[chapterNum].content;
        
        // Update current chapter
        this.currentChapter = chapterNum;
        
        // Update music mode display for this chapter
        this.updateMusicModeDisplay();
        
        // Stop music if this chapter is disabled
        if (this.disabledChapters.has(chapterNum)) {
            this.stopMusic();
        }
        
        // Sequential loading: background first
        const firstBg = chapterContent.querySelector('.bg-change');
        if (firstBg) {
            this.changeBackground(firstBg.dataset.src);
        }
        
        // Then show chapter container and music after 0.5 seconds
        setTimeout(() => {
            chapterContainer.classList.remove('hidden');
            chapterContainer.classList.add('active');
            
            const firstMusic = chapterContent.querySelector('.music-change');
            if (firstMusic && this.isMusicEnabled()) {
                this.changeMusic(firstMusic.dataset.src);
            }
            
            // Process remaining multimedia elements
            this.processChapterElements();
        }, 500);
        
        // Auto-bookmark if enabled
        if (this.settings.autoBookmark) {
            this.autoBookmarkPage();
        }
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Preload next chapter
        this.preloadChapter(chapterNum + 1);
        
        // Unload old assets
        this.unloadOldAssets(chapterNum);
    }
    
    async showAbout() {
        if (!this.chaptersData.about) return;
        
        this.hideAllPages();
        
        const aboutPage = document.getElementById('about-author-page');
        const aboutContent = document.getElementById('about-content');
        
        aboutContent.innerHTML = this.chaptersData.about.content;
        aboutPage.classList.remove('hidden');
        aboutPage.classList.add('active');
        
        this.currentChapter = null;
    }
    
    hideAllPages() {
        document.querySelectorAll('.page-section').forEach(page => {
            page.classList.remove('active');
        });
    }
    
    processChapterElements() {
        // Skip initial background and music as they're handled in showChapter
        
        // Background changes on scroll
        document.querySelectorAll('.bg-change').forEach(el => {
            if (!el.dataset.triggered) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.changeBackground(el.dataset.src);
                            el.dataset.triggered = 'true';
                        }
                    });
                }, { threshold: 0.5 });
                observer.observe(el);
            }
        });
        
        // Music changes on scroll
        document.querySelectorAll('.music-change').forEach(el => {
            if (!el.dataset.triggered && this.isMusicEnabled()) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.changeMusic(el.dataset.src);
                            el.dataset.triggered = 'true';
                        }
                    });
                }, { threshold: 0.5 });
                observer.observe(el);
            }
        });
        
        // Music stop commands
        document.querySelectorAll('.music-stop').forEach(el => {
            if (!el.dataset.triggered) {
                this.stopMusic();
                el.dataset.triggered = 'true';
            }
        });
        
        // Sound effects
        document.querySelectorAll('.sound-effect').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.settings.effectsEnabled) {
                    this.toggleSoundEffect(btn);
                }
            });
        });
        
        // Auto sound effects
        document.querySelectorAll('.auto-sound').forEach(el => {
            if (!el.dataset.triggered && this.settings.effectsEnabled) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.playSound(el.dataset.src);
                            el.dataset.triggered = 'true';
                            observer.unobserve(el);
                        }
                    });
                }, { threshold: 0.5 });
                observer.observe(el);
            }
        });
        
        // Clickable sound text
        document.querySelectorAll('.clickable-sound').forEach(span => {
            span.addEventListener('click', () => {
                if (this.settings.effectsEnabled) {
                    this.toggleClickableSound(span);
                }
            });
        });
        
        // Chapter links
        document.querySelectorAll('.chapter-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.startsWith('#chapter-')) {
                    const chapterNum = parseInt(href.replace('#chapter-', ''));
                    if (!isNaN(chapterNum) && this.chaptersData[chapterNum]) {
                        this.navigateToChapter(chapterNum);
                    }
                }
            });
        });
    }
    
    changeBackground(src) {
        const container = document.getElementById('background-container');
        if (container) {
            const fullSrc = new URL(src, window.location.href).href;
            if (container.style.backgroundImage !== `url("${fullSrc}")`) {
                container.style.backgroundImage = `url(${src})`;
                this.loadedAssets.add(src);
            }
        }
    }
    
    setFrontPageBackground() {
        const container = document.getElementById('background-container');
        if (container) {
            container.style.backgroundImage = 'url(assets/images/backgrounds/book-cover.jpg), url(assets/images/backgrounds/old-library.jpg), linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)';
        }
    }
    
    isMusicEnabled() {
        if (this.settings.musicMode === 'disabled') return false;
        if (this.currentChapter && this.disabledChapters.has(this.currentChapter)) return false;
        return this.settings.musicMode === 'enabled';
    }
    
    updateMusicModeDisplay() {
        const musicMode = document.getElementById('music-mode');
        if (musicMode) {
            if (this.currentChapter && this.disabledChapters.has(this.currentChapter)) {
                musicMode.value = 'chapter-disabled';
            } else {
                musicMode.value = this.settings.musicMode;
            }
        }
    }
    
    changeMusic(src) {
        const audio = document.getElementById('background-music');
        if (audio && this.isMusicEnabled()) {
            const fullSrc = new URL(src, window.location.href).href;
            if (audio.src !== fullSrc) {
                if (!audio.paused && audio.src) {
                    this.crossfadeMusic(src);
                } else {
                    audio.src = src;
                    audio.volume = this.settings.musicVolume / 100;
                    audio.loop = this.settings.musicLoop;
                    audio.play().catch(console.error);
                }
                this.loadedAssets.add(src);
            }
        }
    }
    
    crossfadeMusic(newSrc) {
        const audio = document.getElementById('background-music');
        const originalVolume = this.settings.musicVolume / 100;
        
        const fadeOut = setInterval(() => {
            if (audio.volume > 0.05) {
                audio.volume -= 0.05;
            } else {
                clearInterval(fadeOut);
                audio.src = newSrc;
                audio.volume = 0;
                audio.play().catch(console.error);
                
                const fadeIn = setInterval(() => {
                    if (audio.volume < originalVolume - 0.05) {
                        audio.volume += 0.05;
                    } else {
                        audio.volume = originalVolume;
                        clearInterval(fadeIn);
                    }
                }, 50);
            }
        }, 50);
    }
    
    stopMusic() {
        const audio = document.getElementById('background-music');
        if (audio && !audio.paused) {
            const fadeOut = setInterval(() => {
                if (audio.volume > 0.05) {
                    audio.volume -= 0.05;
                } else {
                    clearInterval(fadeOut);
                    audio.pause();
                    audio.currentTime = 0;
                    audio.src = '';
                }
            }, 50);
        }
    }
    
    playSound(src) {
        const audio = document.getElementById('sound-effect');
        if (audio) {
            audio.src = src;
            audio.volume = this.settings.effectsVolume / 100;
            audio.play().catch(console.error);
            this.loadedAssets.add(src);
        }
    }
    
    toggleSoundEffect(btn) {
        const audio = document.getElementById('sound-effect');
        if (!audio) return;
        
        if (btn.dataset.playing === 'true') {
            audio.pause();
            audio.currentTime = 0;
            btn.dataset.playing = 'false';
            btn.style.opacity = '1';
        } else {
            audio.src = btn.dataset.src;
            audio.volume = this.settings.effectsVolume / 100;
            audio.play().catch(console.error);
            btn.dataset.playing = 'true';
            btn.style.opacity = '0.6';
            
            audio.onended = () => {
                btn.dataset.playing = 'false';
                btn.style.opacity = '1';
            };
        }
    }
    
    toggleClickableSound(span) {
        const audio = document.getElementById('sound-effect');
        if (!audio) return;
        
        if (span.dataset.playing === 'true') {
            audio.pause();
            audio.currentTime = 0;
            span.dataset.playing = 'false';
            span.style.textShadow = '';
        } else {
            audio.src = span.dataset.src;
            audio.volume = this.settings.effectsVolume / 100;
            audio.play().catch(console.error);
            span.dataset.playing = 'true';
            span.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
            
            audio.onended = () => {
                span.dataset.playing = 'false';
                span.style.textShadow = '';
            };
        }
    }
    
    updateNavigationButtons() {
        const backBtn = document.getElementById('back-btn');
        const nextBtn = document.getElementById('next-btn');
        const totalChapters = Object.keys(this.chaptersData).filter(k => k !== 'about').length;
        
        if (backBtn) {
            backBtn.onclick = () => {
                if (this.currentChapter > 1) {
                    this.navigateToChapter(this.currentChapter - 1);
                } else {
                    this.navigateToHome();
                }
            };
        }
        
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (this.currentChapter < totalChapters) {
                    this.navigateToChapter(this.currentChapter + 1);
                } else {
                    this.navigateToHome();
                }
            };
        }
    }
    
    preloadChapter(chapterNum) {
        if (this.chaptersData[chapterNum]) {
            // Preload assets for next chapter
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.chaptersData[chapterNum].content;
            
            // Preload background images
            tempDiv.querySelectorAll('.bg-change').forEach(el => {
                const img = new Image();
                img.src = el.dataset.src;
            });
            
            // Preload music
            tempDiv.querySelectorAll('.music-change').forEach(el => {
                const audio = new Audio();
                audio.src = el.dataset.src;
            });
        }
    }
    
    unloadOldAssets(currentChapter) {
        // Keep assets for current, previous, and next chapters
        const keepChapters = [currentChapter - 1, currentChapter, currentChapter + 1];
        
        // This is a simplified version - in a full implementation,
        // you'd track which assets belong to which chapters
        // and remove unused ones from memory
    }
    
    setupEventListeners() {
        // Settings panel
        const settingsToggle = document.getElementById('settings-toggle');
        const settingsPanel = document.getElementById('settings-panel');
        
        if (settingsToggle) {
            settingsToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsPanel.classList.toggle('hidden');
            });
        }
        
        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsPanel.contains(e.target)) {
                settingsPanel.classList.add('hidden');
            }
        });
        
        settingsPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Settings controls
        const controls = {
            'font-size': 'fontSize',
            'font-family': 'fontFamily',
            'text-color': 'textColor',
            'bg-opacity': 'bgOpacity',
            'music-volume': 'musicVolume',
            'effects-volume': 'effectsVolume'
        };
        
        // Music loop toggle
        const musicLoop = document.getElementById('music-loop');
        if (musicLoop) {
            musicLoop.addEventListener('click', () => {
                this.settings.musicLoop = !this.settings.musicLoop;
                this.saveSettings();
                this.updateToggleButtons();
                const bgMusic = document.getElementById('background-music');
                if (bgMusic) bgMusic.loop = this.settings.musicLoop;
            });
        }
        
        Object.entries(controls).forEach(([id, setting]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = this.settings[setting];
                element.addEventListener('change', (e) => {
                    this.settings[setting] = e.target.value;
                    this.saveSettings();
                    this.applySettings();
                });
                element.addEventListener('input', (e) => {
                    this.settings[setting] = e.target.value;
                    this.saveSettings();
                    this.applySettings();
                });
            }
        });
        
        // Music mode dropdown
        const musicMode = document.getElementById('music-mode');
        if (musicMode) {
            musicMode.addEventListener('change', (e) => {
                if (e.target.value === 'chapter-disabled' && this.currentChapter) {
                    this.disabledChapters.add(this.currentChapter);
                    this.saveSettings();
                    this.stopMusic();
                } else if (e.target.value === 'enabled') {
                    if (this.currentChapter) {
                        this.disabledChapters.delete(this.currentChapter);
                    }
                    this.settings.musicMode = 'enabled';
                    this.saveSettings();
                    this.handleMusicModeChange();
                } else {
                    this.settings.musicMode = e.target.value;
                    this.saveSettings();
                    this.handleMusicModeChange();
                }
                this.updateMusicModeDisplay();
            });
        }
        
        // Auto-bookmark toggle
        const autoBookmark = document.getElementById('auto-bookmark');
        if (autoBookmark) {
            autoBookmark.addEventListener('click', () => {
                this.settings.autoBookmark = !this.settings.autoBookmark;
                this.saveSettings();
                this.updateToggleButtons();
            });
        }
        
        // Toggle buttons
        const effectsToggle = document.getElementById('effects-toggle');
        
        if (effectsToggle) {
            effectsToggle.addEventListener('click', () => {
                this.settings.effectsEnabled = !this.settings.effectsEnabled;
                this.saveSettings();
                this.updateToggleButtons();
            });
        }
        
        // Navigation buttons
        const homeBtn = document.getElementById('home-btn');
        const aboutHomeBtn = document.getElementById('about-home-btn');
        const bookmarkBtn = document.getElementById('bookmark-btn');
        
        if (homeBtn) homeBtn.addEventListener('click', () => {
            window.location.hash = '';
            window.location.reload();
        });
        if (aboutHomeBtn) aboutHomeBtn.addEventListener('click', () => {
            window.location.hash = '';
            window.location.reload();
        });
        if (bookmarkBtn) bookmarkBtn.addEventListener('click', () => {
            this.saveBookmark();
        });
    }
    
    updateToggleButtons() {
        const effectsToggle = document.getElementById('effects-toggle');
        const musicLoop = document.getElementById('music-loop');
        const autoBookmark = document.getElementById('auto-bookmark');
        
        if (effectsToggle) {
            effectsToggle.textContent = this.settings.effectsEnabled ? 'ON' : 'OFF';
        }
        
        if (musicLoop) {
            musicLoop.textContent = this.settings.musicLoop ? 'ON' : 'OFF';
        }
        
        if (autoBookmark) {
            autoBookmark.textContent = this.settings.autoBookmark ? 'ON' : 'OFF';
        }
    }
    
    handleMusicModeChange() {
        const audio = document.getElementById('background-music');
        if (this.settings.musicMode === 'disabled' || 
            (this.settings.musicMode === 'chapter-disabled' && this.currentChapter)) {
            this.stopMusic();
        } else if (this.settings.musicMode === 'enabled' && this.currentChapter) {
            // Restart music if there's a music element in current chapter
            const firstMusic = document.querySelector('.music-change');
            if (firstMusic) {
                this.changeMusic(firstMusic.dataset.src);
            }
        }
    }
    
    autoBookmarkPage() {
        if (this.currentChapter && this.settings.autoBookmark) {
            setTimeout(() => {
                const chapterTitle = this.chaptersData[this.currentChapter].title;
                document.cookie = `bookmark=${this.currentChapter}|${encodeURIComponent(chapterTitle)}; max-age=${30*24*60*60}; path=/`;
            }, 2000); // Auto-bookmark after 2 seconds
        }
    }
    
    applySettings() {
        const textContainers = document.querySelectorAll('.text-container');
        textContainers.forEach(container => {
            container.style.fontSize = this.settings.fontSize + 'px';
            container.style.fontFamily = this.settings.fontFamily;
            container.style.color = this.settings.textColor;
            container.style.backgroundColor = `rgba(0, 0, 0, ${this.settings.bgOpacity / 100})`;
        });
        
        // Update audio volumes
        const bgMusic = document.getElementById('background-music');
        const soundEffect = document.getElementById('sound-effect');
        
        if (bgMusic) bgMusic.volume = this.settings.musicVolume / 100;
        if (soundEffect) soundEffect.volume = this.settings.effectsVolume / 100;
    }
    
    saveBookmark() {
        if (this.currentChapter) {
            const chapterTitle = this.chaptersData[this.currentChapter].title;
            document.cookie = `bookmark=${this.currentChapter}|${encodeURIComponent(chapterTitle)}; max-age=${30*24*60*60}; path=/`;
            
            const bookmarkBtn = document.getElementById('bookmark-btn');
            if (bookmarkBtn) {
                const originalText = bookmarkBtn.textContent;
                bookmarkBtn.textContent = '✓ Bookmarked!';
                setTimeout(() => {
                    bookmarkBtn.textContent = originalText;
                }, 2000);
            }
        }
    }
    
    reloadBookmarkInfo() {
        const bookmarkInfo = document.getElementById('bookmark-info');
        const bookmarkChapter = document.getElementById('bookmark-chapter');
        const continueBtn = document.getElementById('continue-reading');
        const clearBtn = document.getElementById('clear-bookmark');
        
        // Reset bookmark info
        if (bookmarkInfo) {
            bookmarkInfo.classList.add('hidden');
            bookmarkInfo.style.opacity = '';
        }
        
        this.checkBookmark();
    }
    
    checkBookmark() {
        const cookies = document.cookie.split(';');
        const bookmarkCookie = cookies.find(c => c.trim().startsWith('bookmark='));
        
        if (bookmarkCookie) {
            const bookmarkValue = bookmarkCookie.split('=')[1];
            const [chapter, encodedTitle] = bookmarkValue.split('|');
            const chapterNum = parseInt(chapter);
            
            const bookmarkInfo = document.getElementById('bookmark-info');
            const bookmarkChapter = document.getElementById('bookmark-chapter');
            const continueBtn = document.getElementById('continue-reading');
            const clearBtn = document.getElementById('clear-bookmark');
            
            if (bookmarkInfo && bookmarkChapter && this.chaptersData[chapterNum]) {
                const chapterData = this.chaptersData[chapterNum];
                const chapterTitle = chapterData.title || chapterData.metadata?.title || `Chapter ${chapterNum}`;
                bookmarkChapter.textContent = chapterTitle;
                bookmarkInfo.classList.remove('hidden');
                
                if (continueBtn) {
                    continueBtn.onclick = () => {
                        this.navigateToChapter(chapterNum);
                    };
                }
                
                if (clearBtn) {
                    clearBtn.onclick = () => {
                        if (confirm('Are you sure you want to clear your bookmark?')) {
                            document.cookie = 'bookmark=; max-age=0; path=/';
                            window.location.reload();
                        }
                    };
                }
            }
        }
    }
    
    initFrontPageAnimation(fastMode = false) {
        const bookCover = document.querySelector('.book-cover');
        const chapterNav = document.querySelector('.chapter-nav');
        const bookmarkInfo = document.getElementById('bookmark-info');
        
        const delay1 = fastMode ? 500 : 1000;
        const delay2 = fastMode ? 1000 : 2000;
        
        // Hide all elements initially
        if (bookCover) bookCover.style.opacity = '0';
        if (chapterNav) chapterNav.style.opacity = '0';
        if (bookmarkInfo) bookmarkInfo.style.opacity = '0';
        
        // Set background first
        this.setFrontPageBackground();
        
        // Show title after delay
        setTimeout(() => {
            if (bookCover) {
                bookCover.style.transition = 'opacity 0.5s ease';
                bookCover.style.opacity = '1';
            }
        }, delay1);
        
        // Show navigation and bookmark together after delay
        setTimeout(() => {
            if (chapterNav) {
                chapterNav.style.transition = 'opacity 0.5s ease';
                chapterNav.style.opacity = '1';
            }
            if (bookmarkInfo && !bookmarkInfo.classList.contains('hidden')) {
                bookmarkInfo.style.transition = 'opacity 0.5s ease';
                bookmarkInfo.style.opacity = '1';
            }
        }, delay2);
    }
    
    saveSettings() {
        const settingsToSave = {
            ...this.settings,
            disabledChapters: Array.from(this.disabledChapters)
        };
        localStorage.setItem('soundNovelSettings', JSON.stringify(settingsToSave));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('soundNovelSettings');
        if (saved) {
            const loadedSettings = JSON.parse(saved);
            this.settings = { ...this.settings, ...loadedSettings };
            if (loadedSettings.disabledChapters) {
                this.disabledChapters = new Set(loadedSettings.disabledChapters);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SoundNovelSPA();
});