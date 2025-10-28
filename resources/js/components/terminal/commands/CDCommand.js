/**
 * CDCommand - Change directory
 */
class CDCommand {
    async execute(args, terminal) {
        if (args.length === 0) {
            // No arguments - go to home
            terminal.currentDirectory = '~';
            terminal.saveSessionData();
            return;
        }
        
        const targetDir = args[0];
        
        // Handle root directory
        if (targetDir === '/') {
            terminal.writeError('cd: /: Permission denied (filesystem root not accessible)');
            return;
        }
        
        // Handle home directory shortcuts
        if (targetDir === '~' || targetDir === '/home' || targetDir === '$HOME') {
            terminal.currentDirectory = '~';
            terminal.saveSessionData();
            return;
        }
        
        // Handle current directory
        if (targetDir === '.') {
            return;
        }
        
        // Handle parent directory
        if (targetDir === '..') {
            terminal.navigateUp();
            terminal.saveSessionData();
            return;
        }
        
        // Handle absolute paths starting with ~/
        if (targetDir.startsWith('~/')) {
            const path = targetDir.substring(2);
            if (!path) {
                // Just ~/ means home
                terminal.currentDirectory = '~';
            } else if (terminal.validatePath(path)) {
                terminal.currentDirectory = `~/${path}`;
            } else {
                terminal.writeError(`cd: ${targetDir}: No such file or directory`);
                return;
            }
            terminal.saveSessionData();
            return;
        }
        
        // Handle relative paths
        let newPath;
        if (terminal.currentDirectory === '~') {
            newPath = `~/${targetDir}`;
        } else {
            newPath = `${terminal.currentDirectory}/${targetDir}`;
        }
        
        // Validate the new path
        const pathToValidate = newPath === '~' ? '' : newPath.substring(2);
        
        if (terminal.validatePath(pathToValidate)) {
            // Check if it's a directory, not a file
            const parts = pathToValidate.split('/').filter(p => p);
            let current = terminal.fileSystem.home?.contents?.abdulmelik?.contents;
            
            if (current && parts.length > 0) {
                for (const part of parts) {
                    if (!current[part]) break;
                    if (current[part].type === 'directory') {
                        current = current[part].contents || {};
                    } else {
                        // It's a file, not a directory
                        terminal.writeError(`cd: ${targetDir}: Not a directory`);
                        return;
                    }
                }
            }
            
            terminal.currentDirectory = newPath;
            terminal.saveSessionData();
        } else {
            terminal.writeError(`cd: ${targetDir}: No such file or directory`);
        }
    }
}

export default CDCommand;
