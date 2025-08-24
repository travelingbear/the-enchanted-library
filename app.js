
class IndexApp {
    constructor() {
        this.settings = {
            musicEnabled: true,
            effectsEnabled: true,
            musicVolume: 50,
            effectsVolume: 70,
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
        this.updateUI();
        this.initFrontPageAnimation();
        this.checkBookmark();
    }
    
    setupEventListeners() {
        const musicToggle = document.getElementById('music-toggle');
        const effectsToggle = document.getElementById('effects-toggle');
        const settingsToggle = document.getElementById('settings-toggle');
        const settingsPanel = document.getElementById('settings-panel');
        
        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                this.settings.musicEnabled = !this.settings.musicEnabled;
                this.saveSettings();
                this.updateToggleButtons();
            });
        }
        
        if (effectsToggle) {
            effectsToggle.addEventListener('click', () => {
                this.settings.effectsEnabled = !this.settings.effectsEnabled;
                this.saveSettings();
                this.updateToggleButtons();
            });
        }
        
        if (settingsToggle && settingsPanel) {
            settingsToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsPanel.classList.toggle('hidden');
            });
            
            // Close settings when clicking outside
            document.addEventListener('click', (e) => {
                if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
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
            'bg-opacity': 'bgOpacity'
        };
        
        Object.entries(controls).forEach(([id, setting]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = this.settings[setting];
                element.addEventListener('change', (e) => {
                    this.settings[setting] = e.target.value;
                    this.saveSettings();
                });
            }
        });
    }
    
    updateUI() {
        this.updateToggleButtons();
    }
    
    updateToggleButtons() {
        const musicToggle = document.getElementById('music-toggle');
        const effectsToggle = document.getElementById('effects-toggle');
        
        if (musicToggle) {
            musicToggle.textContent = this.settings.musicEnabled ? 'ON' : 'OFF';
        }
        
        if (effectsToggle) {
            effectsToggle.textContent = this.settings.effectsEnabled ? 'ON' : 'OFF';
        }
    }
    
    initFrontPageAnimation() {
        const container = document.getElementById('background-container');
        const bookCover = document.querySelector('.book-cover');
        const chapterNav = document.querySelector('.chapter-nav');
        const controls = document.querySelector('.controls');
        const bookmarkInfo = document.getElementById('bookmark-info');
        
        // Hide content initially
        if (bookCover) bookCover.style.opacity = '0';
        if (chapterNav) chapterNav.style.opacity = '0';
        if (controls) controls.style.opacity = '0';
        if (bookmarkInfo) bookmarkInfo.style.opacity = '0';
        
        // Set background first
        this.setBackground();
        
        // Show title after 1 second
        setTimeout(() => {
            if (bookCover) {
                bookCover.style.transition = 'opacity 0.8s ease-in-out';
                bookCover.style.opacity = '1';
            }
        }, 1000);
        
        // Show rest after another second
        setTimeout(() => {
            if (chapterNav) {
                chapterNav.style.transition = 'opacity 0.8s ease-in-out';
                chapterNav.style.opacity = '1';
            }
            if (controls) {
                controls.style.transition = 'opacity 0.8s ease-in-out';
                controls.style.opacity = '1';
            }
            if (bookmarkInfo && !bookmarkInfo.classList.contains('hidden')) {
                bookmarkInfo.style.transition = 'opacity 0.8s ease-in-out';
                bookmarkInfo.style.opacity = '1';
            }
        }, 2000);
    }
    
    setBackground() {
        const container = document.getElementById('background-container');
        if (container) {
            // Try to use book cover, fallback to old library, then gradient
            const bgImage = 'assets/images/backgrounds/book-cover.jpg';
            container.style.backgroundImage = `url(${bgImage}), url(assets/images/backgrounds/old-library.jpg), linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)`;
            container.style.backgroundSize = 'cover, cover, cover';
            container.style.backgroundPosition = 'center, center, center';
        }
    }
    
    checkBookmark() {
        const cookies = document.cookie.split(';');
        const bookmarkCookie = cookies.find(c => c.trim().startsWith('bookmark='));
        
        if (bookmarkCookie) {
            const bookmarkValue = bookmarkCookie.split('=')[1];
            const [chapter, title] = bookmarkValue.split('|');
            
            const bookmarkInfo = document.getElementById('bookmark-info');
            const bookmarkChapter = document.getElementById('bookmark-chapter');
            const continueBtn = document.getElementById('continue-reading');
            const dismissBtn = document.getElementById('dismiss-bookmark');
            
            if (bookmarkInfo && bookmarkChapter) {
                bookmarkChapter.textContent = decodeURIComponent(title);
                bookmarkInfo.classList.remove('hidden');
                
                if (continueBtn) {
                    continueBtn.addEventListener('click', () => {
                        window.location.href = `chapter-${chapter}.html`;
                    });
                }
                

                
                const clearBtn = document.getElementById('clear-bookmark');
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        if (confirm('Are you sure you want to clear your bookmark?')) {
                            document.cookie = 'bookmark=; max-age=0; path=/';
                            bookmarkInfo.classList.add('hidden');
                            bookmarkInfo.style.display = 'none';
                            // Hide elements immediately
                            const bookCover = document.querySelector('.book-cover');
                            const chapterNav = document.querySelector('.chapter-nav');
                            const controls = document.querySelector('.controls');
                            if (bookCover) bookCover.style.opacity = '0';
                            if (chapterNav) chapterNav.style.opacity = '0';
                            if (controls) controls.style.opacity = '0';
                            
                            // Scroll to top immediately
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            // Restart front page animation after scroll
                            setTimeout(() => {
                                this.initFrontPageAnimation();
                            }, 300);
                        }
                    });
                }
            }
        }
    }
    
    saveSettings() {
        localStorage.setItem('soundNovelSettings', JSON.stringify(this.settings));
    }
    

    
    loadSettings() {
        const saved = localStorage.getItem('soundNovelSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new IndexApp();
});