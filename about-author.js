
class AboutAuthorApp {
    constructor() {
        this.settings = {
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
        this.initPageTransition();
    }
    
    initPageTransition() {
        setTimeout(() => {
            const textContainer = document.querySelector('.text-container');
            if (textContainer) {
                textContainer.classList.add('loaded');
            }
        }, 100);
    }
    
    setupEventListeners() {
        const homeBtn = document.getElementById('home-btn');
        const settingsBtn = document.getElementById('settings-btn');
        const settingsPanel = document.getElementById('settings-panel');
        
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        
        if (settingsBtn && settingsPanel) {
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsPanel.classList.toggle('hidden');
            });
            
            document.addEventListener('click', (e) => {
                if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
                    settingsPanel.classList.add('hidden');
                }
            });
            
            settingsPanel.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
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
                    this.applySettings();
                });
                element.addEventListener('input', (e) => {
                    this.settings[setting] = e.target.value;
                    this.saveSettings();
                    this.applySettings();
                });
            }
        });
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
    
    saveSettings() {
        localStorage.setItem('aboutAuthorSettings', JSON.stringify(this.settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('aboutAuthorSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AboutAuthorApp();
});