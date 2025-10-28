/**
 * AlienBootCommand - Show ABDULMELINK boot screen
 */
class AlienBootCommand {
    async execute(args, terminal) {
        terminal.writeln('');
        terminal.writeInfo('Initiating ABDULMELINK boot sequence...');
        
        // Get terminal window for z-index manipulation
        const terminalWindow = terminal.container.closest('.LinkOS-window');
        const originalZIndex = terminalWindow ? terminalWindow.style.zIndex : null;
        
        // Dynamically import AlienBootScreen
        try {
            // Lower terminal z-index temporarily so boot screen appears on top
            if (terminalWindow) {
                terminalWindow.style.zIndex = '1000';
            }
            
            const AlienBootScreenModule = await import('../../AlienBootScreen.js');
            const AlienBootScreen = AlienBootScreenModule.default;
            
            const bootScreen = new AlienBootScreen();
            await bootScreen.show(terminal.soundService);
            
            // Restore terminal z-index after boot
            if (terminalWindow) {
                terminalWindow.style.zIndex = originalZIndex || '';
            }
            
            terminal.writeln('');
            terminal.writeSuccess('✓ Boot sequence complete');
            terminal.writeInfo('System online - ABDULMELINK operational');
            terminal.writeln('');
        } catch (error) {
            // Restore z-index even on error
            if (terminalWindow) {
                terminalWindow.style.zIndex = originalZIndex || '';
            }
            terminal.writeError('Failed to load boot screen: ' + error.message);
        }
    }
}

export default AlienBootCommand;
