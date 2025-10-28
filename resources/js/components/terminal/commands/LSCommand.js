/**
 * LSCommand - List directory contents
 */
class LSCommand {
    async execute(args, terminal) {
        // Parse flags and target path
        const flags = {
            longFormat: false,
            showAll: false
        };
        
        let targetPath = null;
        
        for (const arg of args) {
            if (arg.startsWith('-')) {
                // Parse flags
                if (arg.includes('l')) flags.longFormat = true;
                if (arg.includes('a')) flags.showAll = true;
            } else {
                targetPath = arg;
            }
        }
        
        // Determine the actual path to list
        let pathToCheck;
        if (targetPath) {
            // Handle absolute paths starting with ~/
            if (targetPath.startsWith('~/')) {
                pathToCheck = targetPath.substring(2);
            } else if (targetPath.startsWith('/')) {
                terminal.writeError(`ls: cannot access '${targetPath}': No such file or directory`);
                return;
            } else {
                // Relative path
                const currentPath = terminal.getCurrentPath();
                pathToCheck = currentPath ? `${currentPath}/${targetPath}` : targetPath;
            }
        } else {
            // No target specified, use current directory
            pathToCheck = terminal.getCurrentPath();
        }
        
        // Check if it's a file or directory
        const contents = terminal.getDirectoryContents(pathToCheck);
        
        if (contents) {
            // It's a directory, list its contents
            this.listDirectory(contents, flags, terminal);
        } else {
            // Check if it's a file
            const parts = pathToCheck.split('/').filter(p => p);
            const fileName = parts.pop();
            const dirPath = parts.join('/');
            
            const parentContents = terminal.getDirectoryContents(dirPath);
            
            if (parentContents && parentContents[fileName] && parentContents[fileName].type === 'file') {
                // It's a file, display it
                if (flags.longFormat) {
                    this.displayLongFormat([{ name: fileName, item: parentContents[fileName] }], terminal);
                } else {
                    terminal.writeln(fileName);
                }
            } else {
                terminal.writeError(`ls: cannot access '${targetPath || pathToCheck}': No such file or directory`);
            }
        }
    }
    
    /**
     * List directory contents
     */
    listDirectory(contents, flags, terminal) {
        if (Object.keys(contents).length === 0) {
            return; // Empty directory
        }
        
        // Separate directories and files
        const dirs = [];
        const files = [];
        
        for (const [name, item] of Object.entries(contents)) {
            // Skip hidden files unless -a flag
            if (!flags.showAll && name.startsWith('.')) {
                continue;
            }
            
            if (item.type === 'directory') {
                dirs.push({ name, item });
            } else {
                files.push({ name, item });
            }
        }
        
        // Sort alphabetically
        dirs.sort((a, b) => a.name.localeCompare(b.name));
        files.sort((a, b) => a.name.localeCompare(b.name));
        
        // Display based on format
        if (flags.longFormat) {
            this.displayLongFormat([...dirs, ...files], terminal);
        } else {
            this.displayShortFormat([...dirs, ...files], terminal);
        }
    }
    
    /**
     * Display long format listing
     */
    displayLongFormat(items, terminal) {
        items.forEach(({ name, item }) => {
            const type = item.type === 'directory' ? 'd' : '-';
            const permissions = 'rwxr-xr-x';
            const size = String(item.size || 0).padStart(8);
            const modified = item.modified || 'Jan 1 00:00';
            const color = item.type === 'directory' ? '\x1b[34m' : '\x1b[0m';
            
            terminal.writeln(`${type}${permissions} 1 abdulmelik staff ${size} ${modified} ${color}${name}\x1b[0m`);
        });
    }
    
    /**
     * Display short format (columns)
     */
    displayShortFormat(items, terminal) {
        const allItems = items.map(({ name, item }) => {
            const color = item.type === 'directory' ? '\x1b[34m' : '\x1b[0m';
            return { display: `${color}${name}\x1b[0m`, actual: name };
        });
        
        if (allItems.length === 0) return;
        
        // Display in columns
        const termWidth = terminal.terminal.cols;
        const maxLen = Math.max(...allItems.map(i => i.actual.length)) + 2;
        const columns = Math.floor(termWidth / maxLen) || 1;
        
        for (let i = 0; i < allItems.length; i += columns) {
            const row = allItems.slice(i, i + columns);
            const formattedRow = row.map((item, idx) => {
                const actualLen = item.actual.length;
                const displayLen = item.display.length;
                const padding = maxLen - actualLen;
                return item.display + ' '.repeat(padding);
            }).join('');
            terminal.writeln(formattedRow);
        }
    }
}

export default LSCommand;
