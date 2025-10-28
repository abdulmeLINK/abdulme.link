/**
 * HelpCommand - Display available terminal commands
 */
class HelpCommand {
    async execute(args, terminal) {
        const commands = [
            '',
            '\x1b[32m╭─────────────────────────────────────────╮\x1b[0m',
            '\x1b[32m│          Available Commands             │\x1b[0m',
            '\x1b[32m╰─────────────────────────────────────────╯\x1b[0m',
            '',
            '\x1b[36mNavigation:\x1b[0m',
            '  \x1b[33mls\x1b[0m        List directory contents',
            '  \x1b[33mpwd\x1b[0m       Print working directory',
            '  \x1b[33mcd\x1b[0m        Change directory',
            '  \x1b[33mcat\x1b[0m       Display file contents',
            '',
            '\x1b[36mSystem Info:\x1b[0m',
            '  \x1b[33mwhoami\x1b[0m    Display user information',
            '  \x1b[33mneofetch\x1b[0m  Display system information',
            '',
            '\x1b[36mUtilities:\x1b[0m',
            '  \x1b[33mhelp\x1b[0m      Show this help message',
            '  \x1b[33mclear\x1b[0m     Clear the terminal',
            '  \x1b[33mtheme\x1b[0m     Change terminal theme',
            '  \x1b[33msound\x1b[0m     Control sound effects',
            '  \x1b[33malienboot\x1b[0m Show ABDULMELINK boot screen',
            '  \x1b[33mexit\x1b[0m      Close terminal window',
            '',
            '\x1b[36mGames:\x1b[0m',
            '  \x1b[33mgames\x1b[0m     Show available games',
            '  \x1b[33msnake\x1b[0m     Classic snake game',
            '  \x1b[33mtetris\x1b[0m    Block puzzle game',
            '  \x1b[33mtyping\x1b[0m    Typing speed test',
            '  \x1b[33m2048\x1b[0m      Number puzzle game',
            ''
        ];
        
        commands.forEach(line => terminal.writeln(line));
    }
}

export default HelpCommand;
