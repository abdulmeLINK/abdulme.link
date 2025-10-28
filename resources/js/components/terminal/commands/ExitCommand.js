/**
 * ExitCommand - Exit terminal or alien mode
 */
import EventBus from '../../EventBus.js';

class ExitCommand {
    execute(args, terminal) {
        terminal.writeln('');
        
        // Check if we're in alien mode
        if (window.alienTerminalActive) {
            terminal.writeInfo('Exiting ABDULMELINK system...');
            terminal.writeln('');
            
            // Small delay for message to be visible
            setTimeout(() => {
                // Get the ThemeCommand instance to call exitAlienTerminal
                const themeCommand = terminal.commandRegistry.get('theme');
                if (themeCommand && themeCommand.exitAlienTerminal) {
                    themeCommand.exitAlienTerminal();
                } else {
                    // Fallback: manually exit
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
            }, 500);
        } else {
            // Normal terminal mode - close the window via EventBus
            terminal.writeInfo('Closing terminal...');
            terminal.writeln('');
            
            setTimeout(() => {
                const terminalWindow = terminal.container.closest('.LinkOS-window');
                if (terminalWindow) {
                    const windowId = terminalWindow.id?.replace('window-', '');
                    if (windowId) {
                        // Emit window close event so WindowManager can handle it properly
                        EventBus.emit('window:close-requested', { windowId });
                    }
                }
            }, 300);
        }
    }
}

export default ExitCommand;
