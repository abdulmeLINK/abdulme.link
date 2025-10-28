/**
 * ClearCommand - Clear terminal screen
 */
class ClearCommand {
    async execute(args, terminal) {
        terminal.clear();
    }
}

export default ClearCommand;
