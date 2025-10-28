import TERMINAL_THEMES from '../themes/TerminalThemes.js';

/**
 * ThemeCommand - Change terminal theme
 */
class ThemeCommand {
    constructor() {
        this.themes = TERMINAL_THEMES;
    }

    async execute(args, terminal) {
        // No arguments - show available themes
        if (args.length === 0) {
            terminal.writeln('');
            terminal.writeln('\x1b[36m╭─────────────────────────────────────────╮\x1b[0m');
            terminal.writeln('\x1b[36m│          Available Themes               │\x1b[0m');
            terminal.writeln('\x1b[36m╰─────────────────────────────────────────╯\x1b[0m');
            terminal.writeln('');
            
            Object.entries(this.themes).forEach(([key, theme]) => {
                terminal.writeln(`  \x1b[33m${key.padEnd(15)}\x1b[0m ${theme.name}`);
                terminal.writeln(`  ${''.padEnd(15)} \x1b[90m${theme.description}\x1b[0m`);
                terminal.writeln('');
            });
            
            terminal.writeln('\x1b[36mUsage:\x1b[0m theme <name>');
            terminal.writeln('\x1b[36mExample:\x1b[0m theme alien');
            terminal.writeln('');
            return;
        }

        const themeName = args[0].toLowerCase();
        
        if (!this.themes[themeName]) {
            terminal.writeError(`theme: '${themeName}' not found`);
            terminal.writeInfo('Available themes: ' + Object.keys(this.themes).join(', '));
            return;
        }

        // Apply theme
        const theme = this.themes[themeName];
        
        if (terminal.terminal && terminal.terminal.options) {
            terminal.terminal.options.theme = theme;
            
            // Update current theme in terminal
            if (terminal.currentTheme !== undefined) {
                terminal.currentTheme = themeName;
            }
            
            // Save to localStorage
            try {
                localStorage.setItem('terminal_theme', themeName);
            } catch (e) {
                console.warn('Failed to save theme preference:', e);
            }
            
            // Play theme-specific beep sound
            if (terminal.soundService) {
                terminal.soundService.playBeep(themeName);
            }
            
            terminal.writeSuccess(`✓ Theme changed to '${theme.name}'`);
            
            // Special handling for alien theme - create new fullscreen terminal
            if (themeName === 'alien') {
                // Check if already in alien mode
                if (window.alienTerminalActive) {
                    terminal.writeError('Already in alien mode');
                    terminal.writeInfo('Type "exit" or "theme default" to exit alien mode');
                    return;
                }
                
                terminal.writeInfo('Activating ABDULMELINK interface...');
                
                // Create new alien terminal and close current one
                setTimeout(() => {
                    this.createAlienTerminal(terminal);
                }, 100);
            } else {
                // Check if we're exiting from alien mode
                if (window.alienTerminalActive) {
                    this.exitAlienTerminal();
                }
                terminal.writeInfo('Type \'clear\' to see theme changes');
            }
        } else {
            terminal.writeError('Failed to apply theme');
        }
    }

    /**
     * Create new alien fullscreen terminal
     */
    async createAlienTerminal(originalTerminal) {
        // Create black overlay FIRST to prevent any desktop flash
        const blackOverlay = document.createElement('div');
        blackOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000000;
            z-index: 9999998;
        `;
        document.body.appendChild(blackOverlay);
        
        // Hide all desktop elements immediately
        const desktopContainer = document.getElementById('desktop');
        if (desktopContainer) {
            desktopContainer.style.display = 'none';
        }
        
        const dockContainer = document.querySelector('.dock');
        if (dockContainer) {
            dockContainer.style.display = 'none';
        }
        
        // Hide all windows
        const allWindows = document.querySelectorAll('.LinkOS-window');
        allWindows.forEach(win => {
            win.style.display = 'none';
        });
        
        // Show boot screen
        try {
            const AlienBootScreenModule = await import('../../AlienBootScreen.js');
            const AlienBootScreen = AlienBootScreenModule.default;
            const bootScreen = new AlienBootScreen();
            await bootScreen.show(originalTerminal.soundService);
        } catch (error) {
            console.warn('Failed to load boot screen:', error);
        }
        
        // Remove black overlay now that boot is complete
        if (blackOverlay && blackOverlay.parentNode) {
            blackOverlay.parentNode.removeChild(blackOverlay);
        }
        
        // Create fullscreen alien terminal container
        const alienContainer = document.createElement('div');
        alienContainer.id = 'alien-terminal-container';
        alienContainer.className = 'alien-fullscreen';
        alienContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #1a1a1a;
            z-index: 999999;
        `;
        
        // Create terminal content wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'window-content';
        contentWrapper.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000000;
            padding: 40px;
            box-sizing: border-box;
        `;
        
        // Create terminal container
        const terminalContainer = document.createElement('div');
        terminalContainer.className = 'terminal-container';
        terminalContainer.style.cssText = `
            width: 100%;
            height: 100%;
            background: #000000;
        `;
        
        contentWrapper.appendChild(terminalContainer);
        alienContainer.appendChild(contentWrapper);
        
        // Add CRT effects
        const scanlines = document.createElement('div');
        scanlines.className = 'scanlines';
        alienContainer.appendChild(scanlines);
        
        const vignette = document.createElement('div');
        vignette.className = 'vignette';
        alienContainer.appendChild(vignette);
        
        const crtEffect = document.createElement('div');
        crtEffect.className = 'crt-effect';
        alienContainer.appendChild(crtEffect);
        
        document.body.appendChild(alienContainer);
        
        // Create new terminal instance with alien theme (skip boot sound since boot screen already played it)
        const Terminal = (await import('../Terminal.js')).default;
        const alienTerminal = new Terminal(terminalContainer, { skipBootSound: true });
        
        // Wait for terminal to initialize
        await new Promise(resolve => {
            const checkInit = setInterval(() => {
                if (alienTerminal.isInitialized) {
                    clearInterval(checkInit);
                    resolve();
                }
            }, 50);
        });
        
        // Apply alien theme to the xterm instance
        if (alienTerminal.terminal && alienTerminal.terminal.options) {
            alienTerminal.terminal.options.theme = this.themes.alien;
            alienTerminal.currentTheme = 'alien';
            localStorage.setItem('terminal_theme', 'alien');
        }
        
        // Store reference
        window.alienTerminalActive = true;
        window.alienTerminalInstance = alienTerminal;
        window.alienTerminalContainer = alienContainer;
        
        // Start ambient static for atmospheric effect
        if (alienTerminal.soundService) {
            setTimeout(() => {
                alienTerminal.soundService.startAmbientStatic();
            }, 500); // Start after boot sound finishes
        }
        
        // Show welcome message
        alienTerminal.writeln('');
        alienTerminal.writeSuccess('✓ ABDULMELINK system online');
        alienTerminal.writeInfo('Type "exit" or "theme default" to exit alien mode');
        alienTerminal.writeln('');
        alienTerminal.showPrompt();
    }

    /**
     * Exit alien terminal and restore normal desktop
     */
    exitAlienTerminal() {
        // Stop ambient static
        if (window.alienTerminalInstance && window.alienTerminalInstance.soundService) {
            window.alienTerminalInstance.soundService.stopAmbientStatic();
        }
        
        if (window.alienTerminalContainer) {
            window.alienTerminalContainer.remove();
        }
        
        window.alienTerminalActive = false;
        window.alienTerminalInstance = null;
        window.alienTerminalContainer = null;
        
        // Restore desktop
        const desktopContainer = document.getElementById('desktop');
        if (desktopContainer) {
            desktopContainer.style.display = '';
        }
        
        const dockContainer = document.querySelector('.dock');
        if (dockContainer) {
            dockContainer.style.display = '';
        }
        
        // Restore all windows
        const allWindows = document.querySelectorAll('.LinkOS-window');
        allWindows.forEach(win => {
            win.style.display = '';
        });
    }

    /**
     * Hide all desktop elements (deprecated - kept for compatibility)
     */
    hideDesktopElements(terminalWindow) {
        // Hide desktop container
        const desktopContainer = document.getElementById('desktop');
        if (desktopContainer) {
            desktopContainer.style.display = 'none';
            desktopContainer.setAttribute('data-hidden-by-alien', 'true');
        }
        
        // Hide dock
        const dockContainer = document.querySelector('.dock');
        if (dockContainer) {
            dockContainer.style.display = 'none';
            dockContainer.setAttribute('data-hidden-by-alien', 'true');
        }
        
        // Hide all other windows except the terminal
        const allWindows = document.querySelectorAll('.LinkOS-window');
        allWindows.forEach(win => {
            if (win !== terminalWindow) {
                win.style.display = 'none';
                win.setAttribute('data-hidden-by-alien', 'true');
            }
        });
    }

    /**
     * Make terminal fullscreen and headless
     */
    makeTerminalFullscreen(terminal) {
        // Find the terminal window
        const terminalWindow = terminal.container.closest('.LinkOS-window');
        if (terminalWindow) {
            terminalWindow.classList.add('alien-fullscreen');
            terminalWindow.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                z-index: 999999 !important;
            `;
            
            // Titlebar already hidden, but ensure it stays hidden
            const titlebar = terminalWindow.querySelector('.window-titlebar');
            if (titlebar) {
                titlebar.style.display = 'none';
            }
            
            // Make terminal container fill window
            const terminalContainer = terminalWindow.querySelector('.terminal-container');
            if (terminalContainer) {
                terminalContainer.style.cssText = `
                    width: 100% !important;
                    height: 100% !important;
                `;
            }

            // Add CRT monitor effects (scanlines, vignette, pixel grid)
            if (!terminalWindow.querySelector('.scanlines')) {
                const scanlines = document.createElement('div');
                scanlines.className = 'scanlines';
                terminalWindow.appendChild(scanlines);
            }
            
            if (!terminalWindow.querySelector('.vignette')) {
                const vignette = document.createElement('div');
                vignette.className = 'vignette';
                terminalWindow.appendChild(vignette);
            }
            
            if (!terminalWindow.querySelector('.crt-effect')) {
                const crtEffect = document.createElement('div');
                crtEffect.className = 'crt-effect';
                terminalWindow.appendChild(crtEffect);
            }
            
            // Trigger resize
            if (terminal.fitAddon) {
                setTimeout(() => terminal.fitAddon.fit(), 100);
            }
        }
    }

    /**
     * Restore normal terminal window
     */
    restoreTerminalWindow(terminal) {
        const terminalWindow = terminal.container.closest('.LinkOS-window');
        if (terminalWindow && terminalWindow.classList.contains('alien-fullscreen')) {
            // Remove alien fullscreen class (this handles most CSS resets)
            terminalWindow.classList.remove('alien-fullscreen');
            
            // Reset specific inline styles that were added for fullscreen
            terminalWindow.style.position = '';
            terminalWindow.style.top = '';
            terminalWindow.style.left = '';
            terminalWindow.style.width = '';
            terminalWindow.style.height = '';
            terminalWindow.style.maxWidth = '';
            terminalWindow.style.maxHeight = '';
            terminalWindow.style.border = '';
            terminalWindow.style.borderRadius = '';
            terminalWindow.style.boxShadow = '';
            terminalWindow.style.zIndex = '';
            
            // Show window titlebar
            const titlebar = terminalWindow.querySelector('.window-titlebar');
            if (titlebar) {
                titlebar.style.display = '';
            }
            
            // Reset window-content padding that was added for bezel
            const windowContent = terminalWindow.querySelector('.window-content');
            if (windowContent) {
                windowContent.style.position = '';
                windowContent.style.top = '';
                windowContent.style.left = '';
                windowContent.style.right = '';
                windowContent.style.bottom = '';
                windowContent.style.width = '';
                windowContent.style.height = '';
                windowContent.style.padding = '';
                windowContent.style.boxSizing = '';
                windowContent.style.background = '';
            }
            
            // Reset terminal container
            const terminalContainer = terminalWindow.querySelector('.terminal-container');
            if (terminalContainer) {
                terminalContainer.style.position = '';
                terminalContainer.style.width = '';
                terminalContainer.style.height = '';
                terminalContainer.style.padding = '';
                terminalContainer.style.margin = '';
                terminalContainer.style.background = '';
            }

            // Restore ALL desktop elements
            const desktopContainer = document.getElementById('desktop');
            if (desktopContainer && desktopContainer.getAttribute('data-hidden-by-alien') === 'true') {
                desktopContainer.style.display = '';
                desktopContainer.removeAttribute('data-hidden-by-alien');
            }
            
            const dockContainer = document.querySelector('.dock');
            if (dockContainer && dockContainer.getAttribute('data-hidden-by-alien') === 'true') {
                dockContainer.style.display = '';
                dockContainer.removeAttribute('data-hidden-by-alien');
            }
            
            // Restore all other windows
            const allWindows = document.querySelectorAll('.LinkOS-window[data-hidden-by-alien="true"]');
            allWindows.forEach(win => {
                win.style.display = '';
                win.removeAttribute('data-hidden-by-alien');
            });

            // Remove CRT monitor effects
            const scanlines = terminalWindow.querySelector('.scanlines');
            if (scanlines) {
                scanlines.remove();
            }
            
            const vignette = terminalWindow.querySelector('.vignette');
            if (vignette) {
                vignette.remove();
            }
            
            const crtEffect = terminalWindow.querySelector('.crt-effect');
            if (crtEffect) {
                crtEffect.remove();
            }
            
            // Trigger resize to fit terminal properly
            if (terminal.fitAddon) {
                setTimeout(() => terminal.fitAddon.fit(), 100);
            }
        }
    }
}

export default ThemeCommand;
