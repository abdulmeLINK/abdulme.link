/**
 * CatCommand - Display file contents
 */
class CatCommand {
    constructor() {
        this.interrupted = false;
        this.keyHandler = null;
    }

    async execute(args, terminal) {
        if (args.length === 0) {
            terminal.writeError('cat: missing file operand');
            terminal.writeInfo('Try \'cat --help\' for more information.');
            return;
        }
        
        const fileName = args[0];
        
        // Handle help flag
        if (fileName === '--help' || fileName === '-h') {
            terminal.writeln('Usage: cat [FILE]...');
            terminal.writeln('Concatenate FILE(s) to standard output.');
            return;
        }
        
        // Get file from current directory
        const currentPath = terminal.getCurrentPath();
        const contents = terminal.getDirectoryContents(currentPath);
        
        if (!contents || !contents[fileName]) {
            terminal.writeError(`cat: ${fileName}: No such file or directory`);
            return;
        }
        
        const fileItem = contents[fileName];
        
        if (fileItem.type === 'directory') {
            terminal.writeError(`cat: ${fileName}: Is a directory`);
            return;
        }
        
        if (!fileItem.content) {
            terminal.writeError(`cat: ${fileName}: Permission denied or empty file`);
            return;
        }
        
        // Check if alien theme for animated output
        const isAlienTheme = terminal.currentTheme === 'alien';
        
        // Display file content
        const lines = fileItem.content.split('\n');
        
        if (isAlienTheme) {
            // Alien theme: animate line by line with sound effects
            await this.displayAlienStyle(lines, terminal);
        } else {
            // Normal theme: instant display
            lines.forEach(line => terminal.writeln(line));
        }
    }

    /**
     * Display content with alien theme animation and sounds
     */
    async displayAlienStyle(lines, terminal) {
        const charDelay = 15; // ms per character
        
        // Reset interrupted flag
        this.interrupted = false;
        
        // Setup keyboard interrupt handler (Ctrl+C / ESC)
        this.keyHandler = terminal.terminal.onData(key => {
            if (key === '\x03' || key === '\x1b') { // Ctrl+C or ESC
                this.interrupted = true;
            }
        });
        
        try {
            // Start: Play A4 (0.2s) then Db5 (0.1s)
            terminal.soundService?.playAlienCatA4(0.6);
            await this.delay(900);
            if (this.interrupted) return;
            
            terminal.soundService?.playAlienCatDb5(0.10);
            await this.delay(100);
            if (this.interrupted) return;
            
            terminal.soundService?.playAlienCatLineBreak(0.10);
            await this.delay(200);
            if (this.interrupted) return;
            
            for (let i = 0; i < lines.length; i++) {
                if (this.interrupted) break;
                
                const line = lines[i];
                
                // Type out character by character
                for (let j = 0; j < line.length; j++) {
                    if (this.interrupted) break;
                    
                    const char = line[j];
                    terminal.write(char);
                    
                    // Check if character is whitespace
                    if (char === ' ' || char === '\t') {
                        // Play A4 for 0.1s on whitespace
                        terminal.soundService?.playAlienCatA4(0.05);
                        await this.delay(50);
                    } else {
                        await this.delay(charDelay);
                    }
                }
                
                if (this.interrupted) break;
                
                // Move to next line with newline
                terminal.writeln('');
                
                // Play F5 for 0.1s after each line
                terminal.soundService?.playAlienCatLineBreak(0.30);
                await this.delay(300);
            }
            
            if (this.interrupted) {
                terminal.writeln('');
                terminal.writeInfo('^C');
                return;
            }
            
            // End: Play A4 (0.2s) then F5 (0.1s)
            terminal.soundService?.playAlienCatDb5(0.60);
            await this.delay(900);
            if (this.interrupted) return;
            
            terminal.soundService?.playAlienCatA4(0.10);
            await this.delay(100);
            if (this.interrupted) return;
            
            terminal.soundService?.playAlienCatLineBreak(0.10);
            await this.delay(100);
            
        } finally {
            // Always dispose of the key handler
            if (this.keyHandler) {
                this.keyHandler.dispose();
                this.keyHandler = null;
            }
        }
    }

    /**
     * Helper function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default CatCommand;
