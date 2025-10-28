/**
 * WhoAmICommand - Display user information
 */
class WhoAmICommand {
    async execute(args, terminal) {
        const profile = [
            '',
            '    \x1b[36m╭─────────────────────────────────╮\x1b[0m',
            '    \x1b[36m│\x1b[0m           \x1b[32mABDULMELIK\x1b[0m            \x1b[36m│\x1b[0m',
            '    \x1b[36m│\x1b[0m      \x1b[33mFull Stack Developer\x1b[0m       \x1b[36m│\x1b[0m',
            '    \x1b[36m╰─────────────────────────────────╯\x1b[0m',
            '',
            '  \x1b[32m🚀 Skills:\x1b[0m Laravel, Vue.js, React, Node.js',
            '  \x1b[32m💼 Experience:\x1b[0m 5+ years web development',
            '  \x1b[32m🌐 Portfolio:\x1b[0m https://abdulme.link',
            '  \x1b[32m📧 Email:\x1b[0m contact@abdulme.link',
            '  \x1b[32m🐙 GitHub:\x1b[0m https://github.com/abdulmalik',
            ''
        ];
        
        profile.forEach(line => terminal.writeln(line));
    }
}

export default WhoAmICommand;
