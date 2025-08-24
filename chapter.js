
class SoundNovelApp {
    constructor() {
        this.settings = {
            musicEnabled: true,
            effectsEnabled: true,
            musicVolume: 50,
            musicMode: 'enabled',
            musicLoop: false,
            autoBookmark: false,
            disabledChapters: new Set(),
            fontSize: 16,
            fontFamily: 'serif',
            textColor: '#ffffff',
            bgOpacity: 80
        };
        
        this.loadSettings();
        this.initializeApp();
    }
    
    initializeApp() {
        this.setupEventListeners();
        this.applySettings();
        this.processChapterElements();
        this.initPageTransition();
    }
    
    initPageTransition() {
        // Improved page load sequence: background -> music -> content
        this.loadBackgroundFirst(() => {
            this.loadMusicSecond(() => {
                this.showContentLast();
            });
        });
    }
    
    loadBackgroundFirst(callback) {
        const firstBg = document.querySelector('.bg-change');
        if (firstBg) {
            this.changeBackground(firstBg.dataset.src);
            setTimeout(callback, 200);
        } else {
            callback();
        }
    }
    
    loadMusicSecond(callback) {
        const firstMusic = document.querySelector('.music-change');
        
        if (firstMusic && this.shouldPlayMusic()) {
            this.changeMusic(firstMusic.dataset.src);
        }
        
        setTimeout(callback, 300);
    }
    
    showContentLast() {
        setTimeout(() => {
            const textContainer = document.querySelector('.text-container');
            if (textContainer) {
                textContainer.classList.add('loaded');
            }
            
            // Auto-bookmark after page loads if enabled
            if (this.settings.autoBookmark) {
                this.saveBookmark();
            }
        }, 100);
    }
    
    setupEventListeners() {
        // Settings panel
        const settingsBtn = document.getElementById('settings-btn');
        const settingsPanel = document.getElementById('settings-panel');
        
        if (settingsBtn && settingsPanel) {
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsPanel.classList.toggle('hidden');
            });
            
            // Close settings when clicking outside
            document.addEventListener('click', (e) => {
                if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
                    settingsPanel.classList.add('hidden');
                }
            });
            
            // Prevent settings panel clicks from closing it
            settingsPanel.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Settings controls
        const controls = {
            'font-size': 'fontSize',
            'font-family': 'fontFamily', 
            'text-color': 'textColor',
            'bg-opacity': 'bgOpacity',
            'music-volume': 'musicVolume'
        };
        
        Object.entries(controls).forEach(([id, setting]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = this.settings[setting];
                element.addEventListener('change', (e) => {
                    this.updateSetting(setting, e.target.value);
                    if (setting === 'musicVolume') this.updateMusicVolume();
                });
                element.addEventListener('input', (e) => {
                    this.updateSetting(setting, e.target.value);
                    if (setting === 'musicVolume') this.updateMusicVolume();
                });
            }
        });
        
        // Handle music mode dropdown
        const musicMode = document.getElementById('music-mode');
        if (musicMode) {
            this.updateMusicModeDisplay();
            musicMode.addEventListener('change', (e) => {
                this.handleMusicModeChange(e.target.value);
            });
        }
        
        // Handle music loop checkbox
        const musicLoop = document.getElementById('music-loop');
        if (musicLoop) {
            musicLoop.checked = this.settings.musicLoop;
            musicLoop.addEventListener('change', (e) => {
                this.settings.musicLoop = e.target.checked;
                this.saveSettings();
                this.updateMusicLoop();
            });
        }
        
        // Handle auto-bookmark checkbox
        const autoBookmark = document.getElementById('auto-bookmark');
        if (autoBookmark) {
            autoBookmark.checked = this.settings.autoBookmark;
            autoBookmark.addEventListener('change', (e) => {
                this.settings.autoBookmark = e.target.checked;
                this.saveSettings();
                if (e.target.checked) {
                    this.saveBookmark();
                }
            });
        }
        
        // Handle bookmark button
        const bookmarkBtn = document.getElementById('bookmark-btn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                this.saveBookmark();
            });
        }
        
        // Sound effects
        document.querySelectorAll('.sound-effect').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.settings.effectsEnabled) {
                    this.toggleSound(btn);
                }
            });
        });
        
        // Navigation
        const homeBtn = document.getElementById('home-btn');
        const backBtn = document.getElementById('back-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (homeBtn) homeBtn.addEventListener('click', () => this.smoothNavigate('index.html'));
        if (backBtn) backBtn.addEventListener('click', () => this.navigate('back'));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigate('next'));
    }
    
    processChapterElements() {
        // Background changes (excluding initial load)
        document.querySelectorAll('.bg-change').forEach(el => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !el.dataset.triggered) {
                        this.changeBackground(el.dataset.src);
                        el.dataset.triggered = 'true';
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(el);
        });
        
        // Update music loop setting
        this.updateMusicLoop();
        
        // Music changes (excluding initial load)
        document.querySelectorAll('.music-change').forEach(el => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && this.shouldPlayMusic() && !el.dataset.triggered) {
                        this.changeMusic(el.dataset.src);
                        el.dataset.triggered = 'true';
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(el);
        });
        
        // Auto sound effects
        document.querySelectorAll('.auto-sound').forEach(el => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && this.settings.effectsEnabled && !el.dataset.triggered) {
                        this.playAutoSound(el.dataset.src);
                        el.dataset.triggered = 'true';
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(el);
        });
        
        // Clickable sound text
        document.querySelectorAll('.clickable-sound').forEach(span => {
            span.addEventListener('click', () => {
                if (this.settings.effectsEnabled) {
                    this.toggleClickableSound(span);
                }
            });
        });
    }
    
    changeBackground(src) {
        const container = document.getElementById('background-container');
        if (container && container.style.backgroundImage !== `url("${src}")`) {
            // Add fade effect for background changes
            container.style.opacity = '0.7';
            setTimeout(() => {
                container.style.backgroundImage = `url(${src})`;
                container.style.opacity = '1';
            }, 300);
        }
    }
    
    changeMusic(src) {
        const audio = document.getElementById('background-music');
        if (audio && this.shouldPlayMusic()) {
            const fullSrc = new URL(src, window.location.href).href;
            if (audio.src !== fullSrc) {
                audio.src = src;
                this.updateMusicVolume();
                this.updateMusicLoop();
                audio.play().catch(console.error);
            }
        }
    }
    
    shouldPlayMusic() {
        const currentChapter = parseInt(document.body.dataset.chapter) || 1;
        return this.settings.musicEnabled && !this.settings.disabledChapters.has(currentChapter);
    }
    
    handleMusicModeChange(mode) {
        const currentChapter = parseInt(document.body.dataset.chapter) || 1;
        
        if (mode === 'enabled') {
            this.settings.musicEnabled = true;
            this.settings.disabledChapters.delete(currentChapter);
        } else if (mode === 'disabled') {
            this.settings.musicEnabled = false;
        } else if (mode === 'disabled-chapter') {
            this.settings.musicEnabled = true;
            this.settings.disabledChapters.add(currentChapter);
        }
        
        this.saveSettings();
        this.updateMusicPlayback();
        
        // If music was just enabled, force restart the current chapter's music
        if (this.shouldPlayMusic()) {
            const audio = document.getElementById('background-music');
            const firstMusic = document.querySelector('.music-change');
            if (firstMusic) {
                // Force reload the music source
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.src = '';
                }
                setTimeout(() => {
                    this.changeMusic(firstMusic.dataset.src);
                }, 100);
            }
        }
    }
    
    updateMusicModeDisplay() {
        const musicMode = document.getElementById('music-mode');
        const currentChapter = parseInt(document.body.dataset.chapter) || 1;
        
        if (musicMode) {
            if (!this.settings.musicEnabled) {
                musicMode.value = 'disabled';
            } else if (this.settings.disabledChapters.has(currentChapter)) {
                musicMode.value = 'disabled-chapter';
            } else {
                musicMode.value = 'enabled';
            }
        }
    }
    
    updateMusicVolume() {
        const audio = document.getElementById('background-music');
        if (audio) {
            audio.volume = this.settings.musicVolume / 100;
        }
    }
    
    updateMusicPlayback() {
        const audio = document.getElementById('background-music');
        if (audio) {
            if (this.shouldPlayMusic()) {
                if (audio.paused && audio.src) {
                    this.updateMusicVolume();
                    this.updateMusicLoop();
                    audio.play().catch(console.error);
                }
            } else {
                audio.pause();
            }
        }
    }
    
    updateMusicLoop() {
        const audio = document.getElementById('background-music');
        if (audio) {
            audio.loop = this.settings.musicLoop;
            if (this.settings.musicLoop && audio.paused && audio.src && this.shouldPlayMusic()) {
                audio.currentTime = 0;
                audio.play().catch(console.error);
            }
        }
    }
    
    saveBookmark() {
        const currentChapter = parseInt(document.body.dataset.chapter) || 1;
        const chapterTitle = document.querySelector('h1')?.textContent || `Chapter ${currentChapter}`;
        
        document.cookie = `bookmark=${currentChapter}|${encodeURIComponent(chapterTitle)}; max-age=${30*24*60*60}; path=/`;
        
        // Show confirmation
        const bookmarkBtn = document.getElementById('bookmark-btn');
        if (bookmarkBtn) {
            const originalText = bookmarkBtn.textContent;
            bookmarkBtn.textContent = '✓ Bookmarked!';
            setTimeout(() => {
                bookmarkBtn.textContent = originalText;
            }, 2000);
        }
    }
    
    toggleSound(btn) {
        const audio = document.getElementById('sound-effect');
        if (audio) {
            // If same sound is playing, stop it
            if (!audio.paused && audio.src.endsWith(btn.dataset.src)) {
                audio.pause();
                audio.currentTime = 0;
                btn.style.opacity = '1';
            } else {
                // Play new sound
                audio.src = btn.dataset.src;
                audio.play().catch(console.error);
                btn.style.opacity = '0.7';
                
                // Reset opacity when sound ends
                audio.addEventListener('ended', () => {
                    btn.style.opacity = '1';
                }, { once: true });
            }
        }
    }
    
    playSound(src) {
        const audio = document.getElementById('sound-effect');
        if (audio) {
            audio.src = src;
            audio.play().catch(console.error);
        }
    }
    
    playAutoSound(src) {
        if (this.settings.effectsEnabled) {
            const audio = document.getElementById('sound-effect');
            if (audio) {
                audio.src = src;
                audio.play().catch(console.error);
            }
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
            audio.play().catch(console.error);
            span.dataset.playing = 'true';
            span.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
            
            audio.onended = () => {
                span.dataset.playing = 'false';
                span.style.textShadow = '';
            };
        }
    }
    
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
    }
    
    applySettings() {
        const textContainer = document.querySelector('.text-container');
        if (textContainer) {
            textContainer.style.fontSize = this.settings.fontSize + 'px';
            textContainer.style.fontFamily = this.settings.fontFamily;
            textContainer.style.color = this.settings.textColor;
            textContainer.style.backgroundColor = 
                `rgba(0, 0, 0, ${this.settings.bgOpacity / 100})`;
        }
    }
    
    navigate(direction) {
        const currentChapter = parseInt(document.body.dataset.chapter) || 1;
        const totalChapters = 4; // Update this based on your story
        let targetChapter;
        
        if (direction === 'back') {
            targetChapter = currentChapter - 1;
            if (targetChapter < 1) {
                this.smoothNavigate('index.html');
                return;
            }
        } else {
            targetChapter = currentChapter + 1;
            if (targetChapter > totalChapters) {
                this.smoothNavigate('index.html');
                return;
            }
        }
        
        this.smoothNavigate(`chapter-${targetChapter}.html`);
    }
    
    smoothNavigate(url) {
        // Add fade out effect before navigation
        const textContainer = document.querySelector('.text-container');
        if (textContainer) {
            textContainer.style.opacity = '0';
            textContainer.style.transform = 'translateY(-20px)';
        }
        
        setTimeout(() => {
            window.location.href = url;
        }, 400);
    }
    
    saveSettings() {
        const settingsToSave = { ...this.settings };
        settingsToSave.disabledChapters = Array.from(this.settings.disabledChapters);
        localStorage.setItem('soundNovelSettings', JSON.stringify(settingsToSave));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('soundNovelSettings');
        if (saved) {
            const savedSettings = JSON.parse(saved);
            this.settings = { ...this.settings, ...savedSettings };
            if (savedSettings.disabledChapters) {
                this.settings.disabledChapters = new Set(savedSettings.disabledChapters);
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SoundNovelApp();
    
    // Add footnote menu functionality
    app.setupFootnoteMenu = function() {
        const aboutBtn = document.getElementById('about-author-btn');
        const versionBtn = document.getElementById('version-info-btn');
        const modal = document.getElementById('footnote-modal');
        const closeBtn = document.querySelector('.footnote-close');
        const footnoteText = document.getElementById('footnote-text');
        
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => {
                this.loadFootnoteContent('about-author.md', footnoteText, modal);
            });
        }
        
        if (versionBtn) {
            versionBtn.addEventListener('click', () => {
                this.loadFootnoteContent('version-info.md', footnoteText, modal);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    };
    
    app.loadFootnoteContent = async function(filename, textElement, modal) {
        try {
            const response = await fetch(filename);
            const markdown = await response.text();
            const html = this.markdownToHtml(markdown);
            textElement.innerHTML = html;
            modal.classList.remove('hidden');
        } catch (error) {
            textElement.innerHTML = '<h2>Content not available</h2><p>Unable to load content at this time.</p>';
            modal.classList.remove('hidden');
        }
    };
    
    app.markdownToHtml = function(markdown) {
        return markdown
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/^---$/gm, '<hr>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[h|u|l])/gm, '<p>')
            .replace(/$(?![h|u|l|p])/gm, '</p>');
    };
    
    app.setupFootnoteMenu();
});