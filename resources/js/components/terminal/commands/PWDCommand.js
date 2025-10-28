/**
 * PWDCommand - Print working directory
 */
class PWDCommand {
    async execute(args, terminal) {
        terminal.writeln(`\x1b[33m${terminal.currentDirectory}\x1b[0m`);
    }
}

export default PWDCommand;
