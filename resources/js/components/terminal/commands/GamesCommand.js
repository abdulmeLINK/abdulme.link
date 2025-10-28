/**
 * GamesCommand - Show available games
 */
class GamesCommand {
    async execute(args, terminal) {
        const games = [
            '',
            '\x1b[35m╭─────────────────────────────────────────╮\x1b[0m',
            '\x1b[35m│            Available Games              │\x1b[0m',
            '\x1b[35m╰─────────────────────────────────────────╯\x1b[0m',
            '',
            '  \x1b[33msnake\x1b[0m     - Classic snake game',
            '  \x1b[33mtetris\x1b[0m    - Block puzzle game',
            '  \x1b[33mtyping\x1b[0m    - Typing speed test',
            '  \x1b[33m2048\x1b[0m      - Number puzzle game',
            '',
            '\x1b[36mTip: Press ESC or Ctrl+C to exit any game\x1b[0m',
            ''
        ];
        
        games.forEach(line => terminal.writeln(line));
    }
}

export default GamesCommand;
