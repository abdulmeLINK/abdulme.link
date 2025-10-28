import EventBus from '../EventBus.js';
import SoundService from '../../services/SoundService.js';
import FileSystemService from '../../services/FileSystemService.js';
import TERMINAL_THEMES from './themes/TerminalThemes.js';

// Commands
import HelpCommand from './commands/HelpCommand.js';
import ClearCommand from './commands/ClearCommand.js';
import LSCommand from './commands/LSCommand.js';
import PWDCommand from './commands/PWDCommand.js';
import CDCommand from './commands/CDCommand.js';
import CatCommand from './commands/CatCommand.js';
import WhoAmICommand from './commands/WhoAmICommand.js';
import NeofetchCommand from './commands/NeofetchCommand.js';
import GamesCommand from './commands/GamesCommand.js';
import ThemeCommand from './commands/ThemeCommand.js';
import SoundCommand from './commands/SoundCommand.js';
import AlienBootCommand from './commands/AlienBootCommand.js';
import ExitCommand from './commands/ExitCommand.js';

// Games
import SnakeGame from './games/SnakeGame.js';
import TetrisGame from './games/TetrisGame.js';
import TypingGame from './games/TypingGame.js';
import Game2048 from './games/Game2048.js';

/**
 * Terminal - LinkOS Terminal application with xterm.js
 * Provides authentic terminal experience with command system and games
 */
class Terminal {
    constructor(container = null, options = {}) {
        this.container = container;
        this.terminal = null;
        this.fitAddon = null;
        this.webLinksAddon = null;
        
        // Terminal state
        this.isInitialized = false;
        this.currentDirectory = '~';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentInput = '';
        this.isCommandRunning = false;
        this.isGameRunning = false;
        
        // Options
        this.skipBootSound = options.skipBootSound || false;
        
        // Command system
        this.commandRegistry = new Map();
        this.fileSystem = null;
        this.sessionData = null;
        
        // Sound service
        this.soundService = new SoundService();
        this.currentTheme = 'default';
        
        // Configuration - theme loaded from TERMINAL_THEMES
        this.config = {
            theme: TERMINAL_THEMES.default, // Use shared theme system
            fontSize: 11,
            fontFamily: 'Menlo, Monaco, "SF Mono", "Cascadia Code", "JetBrains Mono", "Fira Code", "Source Code Pro", Consolas, "Courier New", monospace',
            lineHeight: 1.2,
            letterSpacing: 0,
            cursorBlink: true,
            cursorStyle: 'block',
            scrollback: 1000,
            tabStopWidth: 4,
            bellSound: true,
            bellStyle: 'sound'
        };
        
        this.init();
    }

    /**
     * Initialize terminal
     */
    async init() {
        try {
            await this.loadDependencies();
            await this.loadFileSystem();
            this.loadSessionData(); // Load session BEFORE setup to get correct initial directory
            this.loadUserPreferences(); // Load user preferences for theme, font, etc.
            this.setupTerminal();
            this.registerCommands();
            this.setupEventListeners();
            
            this.isInitialized = true;
            
            EventBus.emit('terminal:ready', {
                terminalId: this.id,
                config: this.config
            });
            
        } catch (error) {
            console.error('Failed to initialize terminal:', error);
            this.showError('Terminal initialization failed');
        }
    }

    /**
     * Load xterm.js dependencies
     */
    async loadDependencies() {
        // Check if xterm is already loaded
        if (window.Terminal && window.FitAddon && window.WebLinksAddon) {
            return;
        }
        
        return new Promise((resolve, reject) => {
            const scripts = [
                '/js/vendor/xterm.js',
                '/js/vendor/xterm-addon-fit.js',
                '/js/vendor/xterm-addon-web-links.js'
            ];
            
            let loaded = 0;
            
            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loaded++;
                    if (loaded === scripts.length) {
                        resolve();
                    }
                };
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.head.appendChild(script);
            });
        });
    }

    /**
     * Load file system data using centralized FileSystemService
     * Now shares the same filesystem.json with Finder component
     */
    async loadFileSystem() {
        try {
            // Use centralized FileSystemService (storage/data/filesystem.json)
            this.fileSystem = await FileSystemService.loadFileSystem();
            console.log('💻 Terminal: Loaded filesystem from FileSystemService (shared with Finder)');
        } catch (error) {
            console.error('Terminal: Failed to load filesystem:', error);
            this.fileSystem = this.getDefaultFileSystem();
        }
        
        console.log('Terminal: fileSystem loaded', this.fileSystem);
    }

    /**
     * Setup xterm.js terminal
     */
    setupTerminal() {
        // Create container if not provided
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'terminal-container';
        }
        
        // Initialize terminal with current config (already loaded from preferences)
        this.terminal = new window.Terminal(this.config);
        
        // Add addons
        this.fitAddon = new window.FitAddon.FitAddon();
        this.webLinksAddon = new window.WebLinksAddon.WebLinksAddon();
        
        this.terminal.loadAddon(this.fitAddon);
        this.terminal.loadAddon(this.webLinksAddon);
        
        // Open terminal
        this.terminal.open(this.container);
        
        // Apply saved theme after terminal is opened (must be before other settings)
        if (this.currentTheme) {
            this.applyTheme(this.currentTheme);
        }
        
        // Re-apply all config options to ensure they stick after theme application
        this.terminal.options.fontSize = this.config.fontSize;
        this.terminal.options.fontFamily = this.config.fontFamily;
        this.terminal.options.lineHeight = this.config.lineHeight;
        this.terminal.options.cursorStyle = this.config.cursorStyle;
        this.terminal.options.cursorBlink = this.config.cursorBlink;
        this.terminal.options.scrollback = this.config.scrollback;
        this.terminal.options.bellStyle = this.config.bellStyle;
        this.terminal.options.letterSpacing = this.config.letterSpacing;
        this.terminal.options.tabStopWidth = this.config.tabStopWidth;
        
        console.log('✓ Terminal configured:', {
            fontSize: this.config.fontSize,
            fontFamily: this.config.fontFamily,
            cursorStyle: this.config.cursorStyle,
            cursorBlink: this.config.cursorBlink,
            theme: this.currentTheme
        });
        
        // Fit terminal to container
        this.fitAddon.fit();
        
        // Setup input handling
        this.setupInputHandling();
        
        // Show welcome message
        this.showWelcome();
        
        // Show prompt
        this.showPrompt();
        
        // Focus terminal to enable cursor blinking
        this.focus();
        
        // Play boot sound after short delay (skip if flag is set, e.g., from alien boot screen)
        if (!this.skipBootSound) {
            setTimeout(() => {
                this.soundService.playBootSound(this.currentTheme);
            }, 300);
        }
    }

    /**
     * Focus the terminal
     */
    focus() {
        if (this.terminal) {
            this.terminal.focus();
        }
    }

    /**
     * Setup input handling
     */
    setupInputHandling() {
        this.terminal.onData((data) => {
            if (this.isCommandRunning || this.isGameRunning) return;
            
            const code = data.charCodeAt(0);
            
            switch (code) {
                case 13: // Enter
                    this.handleEnter();
                    break;
                    
                case 127: // Backspace
                case 8:
                    this.handleBackspace();
                    break;
                    
                case 9: // Tab
                    this.handleTab();
                    break;
                    
                case 3: // Ctrl+C
                    this.handleCtrlC();
                    break;
                    
                case 12: // Ctrl+L
                    this.handleClear();
                    break;
                    
                case 1: // Ctrl+A
                    this.handleCtrlA();
                    break;
                    
                case 5: // Ctrl+E
                    this.handleCtrlE();
                    break;
                    
                case 11: // Ctrl+K
                    this.handleCtrlK();
                    break;
                    
                case 21: // Ctrl+U
                    this.handleCtrlU();
                    break;
                    
                case 23: // Ctrl+W
                    this.handleCtrlW();
                    break;
                    
                default:
                    // Handle special keys
                    if (data === '\x1b[A') { // Up arrow
                        this.handleUpArrow();
                    } else if (data === '\x1b[B') { // Down arrow
                        this.handleDownArrow();
                    } else if (data === '\x1b[C') { // Right arrow
                        this.handleRightArrow();
                    } else if (data === '\x1b[D') { // Left arrow
                        this.handleLeftArrow();
                    } else if (code >= 32 && code <= 126) { // Printable characters
                        this.handleCharacter(data);
                    }
                    break;
            }
        });
    }

    /**
     * Handle Enter key
     */
    handleEnter() {
        this.terminal.writeln('');
        
        // Play enter sound
        if (this.soundService) {
            this.soundService.generateEnterSound(this.currentTheme);
        }
        
        const command = this.currentInput.trim();
        if (command) {
            this.addToHistory(command);
            this.executeCommand(command);
        } else {
            this.showPrompt();
        }
        
        this.currentInput = '';
        this.historyIndex = -1;
    }

    /**
     * Handle Backspace
     */
    handleBackspace() {
        if (this.currentInput.length > 0) {
            this.currentInput = this.currentInput.slice(0, -1);
            this.terminal.write('\b \b');
            
            // Play a softer keypress sound for backspace
            if (this.soundService) {
                this.soundService.playKeypressSound(this.currentTheme);
            }
        }
    }

    /**
     * Handle Tab completion
     */
    handleTab() {
        // Play tab sound
        if (this.soundService) {
            this.soundService.generateTabSound(this.currentTheme);
        }
        
        const completions = this.getCompletions(this.currentInput);
        if (completions.length === 1) {
            const completion = completions[0];
            // Clear current line and write completion
            const promptLength = this.getPromptLength();
            this.terminal.write(`\x1b[${promptLength + 1}G\x1b[K`);
            this.currentInput = completion;
            this.terminal.write(completion);
        } else if (completions.length > 1) {
            this.terminal.writeln('');
            this.showCompletions(completions);
            this.showPrompt();
            this.terminal.write(this.currentInput);
        }
    }

    /**
     * Handle Ctrl+C
     */
    handleCtrlC() {
        this.terminal.writeln('^C');
        this.currentInput = '';
        this.isCommandRunning = false;
        this.showPrompt();
    }

    /**
     * Handle Ctrl+L (clear)
     */
    handleClear() {
        this.terminal.clear();
        this.showPrompt();
    }

    /**
     * Handle Ctrl+A (beginning of line)
     */
    handleCtrlA() {
        // Move cursor to beginning of input
        const promptLength = this.getPromptLength();
        this.terminal.write(`\x1b[${promptLength + 1}G`);
    }

    /**
     * Handle Ctrl+E (end of line)
     */
    handleCtrlE() {
        // Move cursor to end of input
        const promptLength = this.getPromptLength();
        this.terminal.write(`\x1b[${promptLength + this.currentInput.length + 1}G`);
    }

    /**
     * Handle Ctrl+K (cut to end)
     */
    handleCtrlK() {
        this.terminal.write('\x1b[K'); // Clear from cursor to end of line
        this.currentInput = '';
    }

    /**
     * Handle Ctrl+U (cut to beginning)
     */
    handleCtrlU() {
        // Clear from beginning to cursor
        const promptLength = this.getPromptLength();
        this.terminal.write(`\x1b[${promptLength + 1}G\x1b[K`);
        this.currentInput = '';
    }

    /**
     * Handle Ctrl+W (delete word)
     */
    handleCtrlW() {
        const words = this.currentInput.split(' ');
        if (words.length > 1) {
            words.pop();
            const newInput = words.join(' ') + ' ';
            const diff = this.currentInput.length - newInput.length;
            
            for (let i = 0; i < diff; i++) {
                this.terminal.write('\b \b');
            }
            
            this.currentInput = newInput;
        } else {
            this.handleCtrlU();
        }
    }

    /**
     * Handle up arrow (command history)
     */
    handleUpArrow() {
        if (this.commandHistory.length === 0) return;
        
        if (this.historyIndex === -1) {
            this.historyIndex = this.commandHistory.length - 1;
        } else if (this.historyIndex > 0) {
            this.historyIndex--;
        }
        
        this.replaceCurrentInput(this.commandHistory[this.historyIndex]);
    }

    /**
     * Handle down arrow (command history)
     */
    handleDownArrow() {
        if (this.historyIndex === -1) return;
        
        this.historyIndex++;
        
        if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = -1;
            this.replaceCurrentInput('');
        } else {
            this.replaceCurrentInput(this.commandHistory[this.historyIndex]);
        }
    }

    /**
     * Handle right arrow
     */
    handleRightArrow() {
        // TODO: Implement cursor movement within line
    }

    /**
     * Handle left arrow
     */
    handleLeftArrow() {
        // TODO: Implement cursor movement within line
    }

    /**
     * Handle character input
     */
    handleCharacter(char) {
        this.currentInput += char;
        this.terminal.write(char);
        
        // Play keypress sound for typing
        if (this.soundService) {
            this.soundService.playKeypressSound(this.currentTheme);
        }
    }

    /**
     * Replace current input line
     */
    replaceCurrentInput(newInput) {
        // Clear current input
        const promptLength = this.getPromptLength();
        this.terminal.write(`\x1b[${promptLength + 1}G\x1b[K`);
        
        // Write new input
        this.currentInput = newInput;
        this.terminal.write(newInput);
    }

    /**
     * Get prompt length for cursor positioning
     */
    getPromptLength() {
        return `${this.getUserName()}:${this.currentDirectory}$ `.length;
    }

    /**
     * Show welcome message
     */
    /**
     * Show welcome message with adaptive width and contextual session info
     */
    showWelcome() {
        try {
            const cols = (this.terminal && this.terminal.cols) ? this.terminal.cols : 80;
            const maxInnerWidth = Math.min(53, Math.max(40, cols - 8));
            const pad = (s = '') => {
                const len = s.replace(/\x1b\[[0-9;]*m/g, '').length;
                const totalPad = Math.max(0, maxInnerWidth - len);
                const left = Math.floor(totalPad / 2);
                const right = totalPad - left;
                return ' '.repeat(left) + s + ' '.repeat(right);
            };

            // Dynamic greeting based on local time
            const hour = new Date().getHours();
            const timeGreeting = hour < 12 ? 'Good morning' : (hour < 18 ? 'Good afternoon' : 'Good evening');

            // Session context (if available)
            const lastCommands = (this.sessionData && Array.isArray(this.sessionData.commandHistory))
                ? this.sessionData.commandHistory.length
                : 0;
            const lastDir = (this.sessionData && this.sessionData.currentDirectory) ? this.sessionData.currentDirectory : this.currentDirectory;

            const boxTop = '╭' + '─'.repeat(maxInnerWidth) + '╮';
            const boxBottom = '╰' + '─'.repeat(maxInnerWidth) + '╯';

            const content = [
                boxTop,
                '│' + pad(`\x1b[32m✨ AbdulmeLink Terminal ✨\x1b[0m`) + '│',
                '│' + pad('') + '│',
                '│' + pad(`${timeGreeting}, welcome to LinkOS`) + '│',
                '│' + pad('An authentic macOS-inspired terminal experience') + '│',
                '│' + pad('') + '│',
                '│' + pad(`Type \x1b[33mhelp\x1b[0m to list commands — Type \x1b[33mgames\x1b[0m for games`) + '│',
                '│' + pad('') + '│',
                '│' + pad(`Session: ${lastCommands} commands | CWD: ${lastDir}`) + '│',
                boxBottom,
                ''
            ];

            content.forEach(line => this.terminal.writeln(line));
        } catch (e) {
            // Fail gracefully — fallback to a minimal welcome
            try {
                this.terminal.writeln('Welcome to AbdulmeLink Terminal — type help for commands.');
            } catch (err) {
                // ignore
            }
        }
    }

    /**
     * Show command prompt
     */
    showPrompt() {
        const userName = this.getUserName();
        const prompt = `\x1b[32m${userName}\x1b[0m:\x1b[34m${this.currentDirectory}\x1b[0m$ `;
        this.terminal.write(prompt);
    }

    /**
     * Get username for prompt
     */
    getUserName() {
        return 'guest';
    }

    /**
     * Add command to history
     */
    addToHistory(command) {
        this.commandHistory.push(command);
        
        // Limit history size
        if (this.commandHistory.length > 100) {
            this.commandHistory.shift();
        }
        
        // Save to session storage
        this.saveSessionData();
    }

    /**
     * Execute command
     */
    async executeCommand(input) {
        this.isCommandRunning = true;
        
        const parts = input.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        try {
            if (this.commandRegistry.has(command)) {
                const commandHandler = this.commandRegistry.get(command);
                await commandHandler.execute(args, this);
            } else {
                this.writeError(`command not found: ${command}`);
                this.suggestCommands(command);
            }
        } catch (error) {
            this.writeError(`Error executing command: ${error.message}`);
        }
        
        this.isCommandRunning = false;
        this.showPrompt();
    }

    /**
     * Register commands
     */
    registerCommands() {
        // Import and register commands will be implemented separately
        this.registerCommand('help', new HelpCommand());
        this.registerCommand('clear', new ClearCommand());
        this.registerCommand('ls', new LSCommand());
        this.registerCommand('pwd', new PWDCommand());
        this.registerCommand('cd', new CDCommand());
        this.registerCommand('cat', new CatCommand());
        this.registerCommand('whoami', new WhoAmICommand());
        this.registerCommand('neofetch', new NeofetchCommand());
        this.registerCommand('theme', new ThemeCommand());
        this.registerCommand('sound', new SoundCommand());
        this.registerCommand('alienboot', new AlienBootCommand());
        this.registerCommand('exit', new ExitCommand());
        
        // Games
        this.registerCommand('games', new GamesCommand());
        this.registerCommand('snake', new SnakeGame());
        this.registerCommand('tetris', new TetrisGame());
        this.registerCommand('typing', new TypingGame());
        this.registerCommand('2048', new Game2048());
    }

    /**
     * Register a command
     */
    registerCommand(name, handler) {
        this.commandRegistry.set(name, handler);
    }

    /**
     * Get command completions
     */
    getCompletions(input) {
        const parts = input.split(' ');
        const commandName = parts[0];
        
        // If only typing command, complete command names
        if (parts.length === 1) {
            const commands = Array.from(this.commandRegistry.keys());
            return commands.filter(cmd => cmd.startsWith(input));
        }
        
        // If typing arguments, complete filenames/directories
        if (parts.length >= 2 && (commandName === 'cd' || commandName === 'cat' || commandName === 'ls')) {
            const partial = parts[parts.length - 1];
            const currentPath = this.getCurrentPath();
            const contents = this.getDirectoryContents(currentPath);
            
            if (!contents) return [];
            
            const items = Object.keys(contents);
            
            // For cd, only show directories
            if (commandName === 'cd') {
                const dirs = items.filter(name => 
                    contents[name].type === 'directory' && name.startsWith(partial)
                );
                return dirs.map(dir => `${parts.slice(0, -1).join(' ')} ${dir}`);
            }
            
            // For cat and ls, show all items
            const matches = items.filter(name => name.startsWith(partial));
            return matches.map(match => `${parts.slice(0, -1).join(' ')} ${match}`);
        }
        
        return [];
    }

    /**
     * Show completions
     */
    showCompletions(completions) {
        const columns = Math.floor(this.terminal.cols / 20);
        let output = '';
        
        for (let i = 0; i < completions.length; i++) {
            output += completions[i].padEnd(20);
            if ((i + 1) % columns === 0) {
                output += '\r\n';
            }
        }
        
        this.terminal.write(output);
        this.terminal.writeln('');
    }

    /**
     * Suggest commands for typos
     */
    suggestCommands(input) {
        const commands = Array.from(this.commandRegistry.keys());
        const suggestions = commands.filter(cmd => 
            this.levenshteinDistance(input, cmd) <= 2
        );
        
        if (suggestions.length > 0) {
            this.terminal.writeln(`\x1b[33mDid you mean: ${suggestions.join(', ')}?\x1b[0m`);
        }
    }

    /**
     * Calculate Levenshtein distance for suggestions
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Write text to terminal
     */
    write(text) {
        this.terminal.write(text);
    }

    /**
     * Write line to terminal
     */
    writeln(text) {
        this.terminal.writeln(text);
    }

    /**
     * Write error message
     */
    writeError(message) {
        this.terminal.writeln(`\x1b[31m${message}\x1b[0m`);
    }

    /**
     * Write success message
     */
    writeSuccess(message) {
        this.terminal.writeln(`\x1b[32m${message}\x1b[0m`);
    }

    /**
     * Write info message
     */
    writeInfo(message) {
        this.terminal.writeln(`\x1b[36m${message}\x1b[0m`);
    }

    /**
     * Write warning message
     */
    writeWarning(message) {
        this.terminal.writeln(`\x1b[33m${message}\x1b[0m`);
    }

    /**
     * Clear terminal
     */
    clear() {
        this.terminal.clear();
    }

    /**
     * Set game running state to disable normal input handling
     */
    setGameRunning(isRunning) {
        this.isGameRunning = isRunning;
        if (!isRunning) {
            // Clear any accumulated input when game ends
            this.currentInput = '';
        }
    }

    /**
     * Write prompt (used by games to return to command prompt)
     */
    writePrompt() {
        this.terminal.write(`\n\x1b[32m${this.currentDirectory}\x1b[0m $ `);
    }

    /**
     * Get current path without ~ prefix
     */
    getCurrentPath() {
        if (this.currentDirectory === '~') {
            return '';
        }
        // Remove ~/ prefix and return the path
        return this.currentDirectory.substring(2);
    }

    /**
     * Validate if a path exists in the filesystem
     */
    validatePath(path) {
        if (!this.fileSystem) return false;
        
        if (!path || path === '') {
            return true; // Root (home/abdulmelik) always exists
        }
        
        // Start from /home/abdulmelik/contents
        let current = this.fileSystem.home?.contents?.abdulmelik?.contents;
        if (!current) return false;
        
        // Navigate through the path
        const parts = path.split('/').filter(p => p);
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            
            if (!current[part]) {
                return false;
            }
            
            if (current[part].type === 'directory') {
                // Navigate to contents of directory
                current = current[part].contents || {};
            } else if (i < parts.length - 1) {
                // It's a file but we're not at the end of the path
                return false;
            }
        }
        
        return true;
    }

    /**
     * Get contents of a directory
     */
    getDirectoryContents(path) {
        if (!this.fileSystem) {
            console.error('Terminal: fileSystem is not loaded');
            return null;
        }
        
        // Start from /home/abdulmelik/contents
        let current = this.fileSystem.home?.contents?.abdulmelik?.contents;
        
        if (!current) {
            console.error('Terminal: Could not access home/abdulmelik/contents', this.fileSystem);
            return null;
        }
        
        // If at root (~), return home directory contents
        if (!path || path === '') {
            return current;
        }
        
        // Navigate through the path
        const parts = path.split('/').filter(p => p);
        
        for (const part of parts) {
            if (!current[part]) {
                return null;
            }
            
            if (current[part].type === 'directory') {
                current = current[part].contents || {};
            } else {
                // It's a file, can't list contents
                return null;
            }
        }
        
        return current;
    }

    /**
     * Navigate up one directory level
     */
    navigateUp() {
        if (this.currentDirectory === '~') {
            return; // Already at root
        }
        
        const parts = this.currentDirectory.split('/');
        parts.pop(); // Remove last part
        
        if (parts.length === 1 && parts[0] === '~') {
            this.currentDirectory = '~';
        } else {
            this.currentDirectory = parts.join('/');
        }
    }

    /**
     * Resize terminal
     */
    resize() {
        if (this.fitAddon) {
            this.fitAddon.fit();
        }
    }

    /**
     * Apply saved theme from localStorage
     */
    applySavedTheme(themeName) {
        // Use shared TERMINAL_THEMES instead of duplicating
        if (TERMINAL_THEMES[themeName]) {
            this.config.theme = TERMINAL_THEMES[themeName];
        }
    }

    /**
     * Get default file system
     */
    getDefaultFileSystem() {
        return {
            "home": {
                "type": "directory",
                "modified": "Oct 1 00:00",
                "size": 4096,
                "contents": {
                    "abdulmelik": {
                        "type": "directory",
                        "modified": "Oct 1 00:00",
                        "size": 4096,
                        "contents": {
                            "README.md": {
                                "type": "file",
                                "modified": "Oct 1 00:00",
                                "size": 128,
                                "content": "# Welcome!\n\nType 'help' for available commands."
                            },
                            "Documents": {
                                "type": "directory",
                                "modified": "Oct 1 00:00",
                                "size": 4096,
                                "contents": {}
                            },
                            "Projects": {
                                "type": "directory",
                                "modified": "Oct 1 00:00",
                                "size": 4096,
                                "contents": {}
                            }
                        }
                    }
                }
            }
        };
    }

    /**
     * Load session data
     */
    loadSessionData() {
        try {
            const saved = localStorage.getItem('terminal_session');
            if (saved) {
                this.sessionData = JSON.parse(saved);
                this.commandHistory = this.sessionData.commandHistory || [];
                this.currentDirectory = this.sessionData.currentDirectory || '~';
            }
        } catch (error) {
            console.warn('Failed to load session data:', error);
        }
    }

    /**
     * Load user preferences for terminal
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('userPreferences');
            if (saved) {
                const prefs = JSON.parse(saved);
                if (prefs.terminal) {
                    const terminal = prefs.terminal;
                    
                    // Apply appearance settings
                    if (terminal.appearance) {
                        if (terminal.appearance.theme) {
                            // Store theme name for later application
                            this.currentTheme = terminal.appearance.theme;
                        }
                        if (terminal.appearance.font_family) {
                            this.config.fontFamily = terminal.appearance.font_family;
                        }
                        if (terminal.appearance.font_size) {
                            this.config.fontSize = parseInt(terminal.appearance.font_size);
                        }
                        if (terminal.appearance.line_height) {
                            this.config.lineHeight = parseFloat(terminal.appearance.line_height);
                        }
                        if (terminal.appearance.cursor_style) {
                            this.config.cursorStyle = terminal.appearance.cursor_style;
                        }
                        if (terminal.appearance.cursor_blink !== undefined) {
                            this.config.cursorBlink = terminal.appearance.cursor_blink;
                        }
                    }
                    
                    // Apply behavior settings
                    if (terminal.behavior) {
                        if (terminal.behavior.history_size) {
                            this.config.scrollback = parseInt(terminal.behavior.history_size);
                        }
                        if (terminal.behavior.bell_sound !== undefined) {
                            this.config.bellSound = terminal.behavior.bell_sound;
                            this.config.bellStyle = terminal.behavior.bell_sound ? 'sound' : 'none';
                        }
                    }
                    
                    console.log('✓ Terminal preferences loaded:', terminal);
                }
            }
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
        }
    }

    /**
     * Save session data
     */
    saveSessionData() {
        try {
            const sessionData = {
                commandHistory: this.commandHistory,
                currentDirectory: this.currentDirectory,
                timestamp: Date.now()
            };
            
            localStorage.setItem('terminal_session', JSON.stringify(sessionData));
        } catch (error) {
            console.warn('Failed to save session data:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.resize();
        });
        
        // App events
        EventBus.on('terminal:command', (data) => {
            if (data.command) {
                this.executeCommand(data.command);
            }
        });
        
        EventBus.on('terminal:clear', () => {
            this.clear();
            this.showPrompt();
        });
        
        // Preference changes
        EventBus.on('preference:changed', (data) => {
            this.handlePreferenceChange(data);
        });
        
        // Initial preferences load
        EventBus.on('preferences:loaded', (preferences) => {
            this.applyAllPreferences(preferences);
        });
    }
    
    /**
     * Handle preference changes
     */
    handlePreferenceChange(data) {
        const { path, value, preferences } = data;
        
        if (!path.startsWith('terminal.')) return;
        
        console.log('Terminal preference changed:', path, value);
        console.log('Terminal initialized:', this.isInitialized, 'Terminal exists:', !!this.terminal);
        
        // Apply specific preference
        if (path === 'terminal.appearance.theme') {
            this.applyTheme(value);
        } else if (path === 'terminal.appearance.font_family') {
            this.config.fontFamily = value;
            if (this.terminal) {
                this.terminal.options.fontFamily = value;
            }
        } else if (path === 'terminal.appearance.font_size') {
            this.config.fontSize = parseInt(value);
            if (this.terminal) {
                this.terminal.options.fontSize = parseInt(value);
            }
        } else if (path === 'terminal.appearance.line_height') {
            this.config.lineHeight = parseFloat(value);
            if (this.terminal) {
                this.terminal.options.lineHeight = parseFloat(value);
            }
        } else if (path === 'terminal.appearance.cursor_style') {
            this.config.cursorStyle = value;
            if (this.terminal) {
                this.terminal.options.cursorStyle = value;
                // Force cursor refresh
                this.terminal.refresh(0, this.terminal.rows - 1);
            }
        } else if (path === 'terminal.appearance.cursor_blink') {
            this.config.cursorBlink = value;
            if (this.terminal) {
                this.terminal.options.cursorBlink = value;
                // Force cursor refresh
                this.terminal.refresh(0, this.terminal.rows - 1);
            }
        } else if (path === 'terminal.behavior.history_size') {
            this.config.scrollback = parseInt(value);
            if (this.terminal) {
                this.terminal.options.scrollback = parseInt(value);
            }
        } else if (path === 'terminal.behavior.bell_sound') {
            this.config.bellSound = value;
            if (this.terminal) {
                this.terminal.options.bellStyle = value ? 'sound' : 'none';
            }
        }
        
        // Trigger resize to apply font/line height changes
        if (path.includes('font') || path.includes('size') || path.includes('line_height')) {
            setTimeout(() => this.resize(), 100);
        }
    }
    
    /**
     * Apply all preferences at once
     */
    applyAllPreferences(preferences) {
        if (!preferences?.terminal) return;
        
        const terminal = preferences.terminal;
        
        // Apply appearance
        if (terminal.appearance) {
            if (terminal.appearance.theme) {
                this.applyTheme(terminal.appearance.theme);
            }
            if (terminal.appearance.font_family) {
                this.config.fontFamily = terminal.appearance.font_family;
                if (this.terminal) {
                    this.terminal.options.fontFamily = terminal.appearance.font_family;
                }
            }
            if (terminal.appearance.font_size) {
                this.config.fontSize = parseInt(terminal.appearance.font_size);
                if (this.terminal) {
                    this.terminal.options.fontSize = parseInt(terminal.appearance.font_size);
                }
            }
            if (terminal.appearance.line_height) {
                this.config.lineHeight = parseFloat(terminal.appearance.line_height);
                if (this.terminal) {
                    this.terminal.options.lineHeight = parseFloat(terminal.appearance.line_height);
                }
            }
            if (terminal.appearance.cursor_style) {
                this.config.cursorStyle = terminal.appearance.cursor_style;
                if (this.terminal) {
                    this.terminal.options.cursorStyle = terminal.appearance.cursor_style;
                }
            }
            if (terminal.appearance.cursor_blink !== undefined) {
                this.config.cursorBlink = terminal.appearance.cursor_blink;
                if (this.terminal) {
                    this.terminal.options.cursorBlink = terminal.appearance.cursor_blink;
                }
            }
        }
        
        // Apply behavior
        if (terminal.behavior) {
            if (terminal.behavior.history_size) {
                this.config.scrollback = parseInt(terminal.behavior.history_size);
                if (this.terminal) {
                    this.terminal.options.scrollback = parseInt(terminal.behavior.history_size);
                }
            }
            if (terminal.behavior.bell_sound !== undefined) {
                this.config.bellSound = terminal.behavior.bell_sound;
                if (this.terminal) {
                    this.terminal.options.bellStyle = terminal.behavior.bell_sound ? 'sound' : 'none';
                }
            }
        }
        
        // Trigger resize to apply changes
        setTimeout(() => this.resize(), 100);
        
        console.log('All terminal preferences applied');
    }
    
    /**
     * Apply terminal theme
     */
    applyTheme(themeName) {
        console.log('Applying theme:', themeName);
        const theme = TERMINAL_THEMES[themeName] || TERMINAL_THEMES.default;
        
        if (!theme) {
            console.error('Theme not found:', themeName);
            return;
        }
        
        if (this.terminal) {
            // Store current cursor settings to preserve them
            const cursorStyle = this.terminal.options.cursorStyle || this.config.cursorStyle;
            const cursorBlink = this.terminal.options.cursorBlink !== undefined ? this.terminal.options.cursorBlink : this.config.cursorBlink;
            
            // Update config theme (only color-related properties)
            Object.assign(this.config.theme, theme);
            
            // Apply theme to terminal
            this.terminal.options.theme = this.config.theme;
            
            // Restore cursor settings (theme shouldn't affect these)
            this.terminal.options.cursorStyle = cursorStyle;
            this.terminal.options.cursorBlink = cursorBlink;
            
            // Trigger refresh to apply theme immediately
            this.terminal.refresh(0, this.terminal.rows - 1);
            
            console.log(`✓ Terminal theme applied: ${themeName} (${theme.name})`);
            console.log('  Cursor preserved:', { style: cursorStyle, blink: cursorBlink });
        } else {
            console.warn('Terminal not initialized yet, theme will be applied on init');
        }
    }

    /**
     * Show error fallback
     */
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div style="
                    padding: 2rem;
                    text-align: center;
                    color: #ff073a;
                    font-family: monospace;
                    background: #000;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <div>
                        <h3>Terminal Error</h3>
                        <p>${message}</p>
                        <button onclick="location.reload()" style="
                            background: #00ff41;
                            color: #000;
                            border: none;
                            padding: 8px 16px;
                            margin-top: 1rem;
                            cursor: pointer;
                        ">Reload</button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Destroy terminal and clean up
     */
    destroy() {
        if (this.terminal) {
            this.terminal.dispose();
        }
        
        this.saveSessionData();
        
        EventBus.off('terminal:command');
        EventBus.off('terminal:clear');
        
        this.terminal = null;
        this.container = null;
    }
}

export default Terminal;