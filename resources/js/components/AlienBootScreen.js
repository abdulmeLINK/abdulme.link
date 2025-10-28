/**
 * AlienBootScreen - Sevastopol-style boot sequence
 * ABDULMELINK - AN LM-LINK PRODUCT
 */
class AlienBootScreen {
    constructor() {
        this.container = null;
        this.progressBar = null;
        this.statusText = null;
        this.currentProgress = 0;
        // Optimized for exactly 3 seconds total boot time
        this.bootSequence = [
            { progress: 15, text: 'WEYLAND-YUTANI BIOS v6.0.0 INITIALIZED', delay: 180 },
            { progress: 30, text: 'RUNNING SYSTEM DIAGNOSTICS...', delay: 200 },
            { progress: 45, text: 'MEMORY CHECK: 262144KB OK', delay: 180 },
            { progress: 60, text: 'LOADING MOTHER INTERFACE...', delay: 200 },
            { progress: 75, text: 'MOUNTING NOSTROMO FILESYSTEM...', delay: 180 },
            { progress: 90, text: 'ESTABLISHING NETWORK PROTOCOLS...', delay: 200 },
            { progress: 100, text: '>>> SYSTEM OPERATIONAL <<<', delay: 360 }
        ];
    }

    /**
     * Create and show boot screen
     */
    show(soundService = null) {
        return new Promise((resolve) => {
            // Create container
            this.container = document.createElement('div');
            this.container.className = 'alien-boot-screen';
            
            // Build HTML - Sevastopol station style (like image)
            this.container.innerHTML = `
                <div class="screen-inner"></div>
                <div class="scanlines"></div>
                <div class="alien-boot-content">
                    <div class="alien-boot-header">
                        <div class="alien-boot-logo">
                            <span class="logo-main">ABDULMELINK</span>
                            <span class="logo-star">★</span>
                        </div>
                        <div class="alien-boot-subtitle">© ME-LINK DATA SYSTEMS</div>
                    </div>
                    
                    <div class="alien-boot-body">
                        <div class="alien-boot-status">INITIATING BOOT SEQUENCE...</div>
                        
                        <div class="alien-boot-progress-container">
                            <div class="alien-boot-progress">
                                <div class="alien-boot-progress-bar"></div>
                            </div>
                        </div>
                        
                        <div class="alien-boot-footer">
                            <div class="alien-boot-copyright">© ME-LINK DATA SYSTEMS</div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.container);
            
            // Get references
            this.progressBar = this.container.querySelector('.alien-boot-progress-bar');
            this.statusText = this.container.querySelector('.alien-boot-status');
            
            // Play boot sound
            if (soundService && soundService.enabled) {
                soundService.playBootSound('alien');
            }
            
            // Start boot sequence
            this.runBootSequence().then(() => {
                // Fade out after exactly 3 seconds
                setTimeout(() => {
                    this.container.classList.add('hidden');
                    setTimeout(() => {
                        if (this.container && this.container.parentNode) {
                            this.container.parentNode.removeChild(this.container);
                        }
                        resolve();
                    }, 400);
                }, 800);
            });
        });
    }

    /**
     * Run boot sequence animation
     */
    async runBootSequence() {
        for (const step of this.bootSequence) {
            await this.updateProgress(step.progress, step.text);
            await this.delay(step.delay);
        }
    }

    /**
     * Update progress bar and status text
     */
    updateProgress(progress, text) {
        return new Promise((resolve) => {
            if (this.progressBar) {
                this.progressBar.style.width = `${progress}%`;
            }
            if (this.statusText) {
                this.statusText.textContent = text;
            }
            this.currentProgress = progress;
            setTimeout(resolve, 100);
        });
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Force hide boot screen
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
            }, 500);
        }
    }
}

export default AlienBootScreen;
