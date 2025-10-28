/**
 * NeofetchCommand - Display system information
 */
class NeofetchCommand {
    async execute(args, terminal) {
        const info = [
            '                   \x1b[34m-`\x1b[0m                    \x1b[32mguest@abdulme.link\x1b[0m',
            '                  \x1b[34m.o+`\x1b[0m                   \x1b[32m-----------------\x1b[0m',
            '                 \x1b[34m`ooo/\x1b[0m                   \x1b[33mOS:\x1b[0m Web Browser',
            '                \x1b[34m`+oooo:\x1b[0m                  \x1b[33mBrowser:\x1b[0m ' + this.getBrowserName(),
            '               \x1b[34m`+oooooo:\x1b[0m                 \x1b[33mPlatform:\x1b[0m ' + navigator.platform,
            '               \x1b[34m-+oooooo+:\x1b[0m                \x1b[33mLanguage:\x1b[0m ' + navigator.language,
            '             \x1b[34m`/:-:++oooo+:\x1b[0m               \x1b[33mOnline:\x1b[0m ' + navigator.onLine,
            '            \x1b[34m`/++++/+++++++:\x1b[0m              \x1b[33mMemory:\x1b[0m ' + (navigator.deviceMemory || 'Unknown') + 'GB',
            '           \x1b[34m`/++++++++++++++:\x1b[0m             \x1b[33mCores:\x1b[0m ' + navigator.hardwareConcurrency,
            '          \x1b[34m`/+++ooooooooo+++/`\x1b[0m            \x1b[33mScreen:\x1b[0m ' + screen.width + 'x' + screen.height,
            '         \x1b[34m./ooosssso++osssssso+`\x1b[0m          \x1b[33mColors:\x1b[0m 16777216',
            '        \x1b[34m.oossssso-````/ossssss+`\x1b[0m         \x1b[33mTerminal:\x1b[0m xterm.js',
            '       \x1b[34m-osssssso.\x1b[0m      \x1b[34m:ssssssso.\x1b[0m        \x1b[33mShell:\x1b[0m Web Terminal',
            '      \x1b[34m:osssssss/\x1b[0m        \x1b[34mosssso+++.\x1b[0m       \x1b[33mUptime:\x1b[0m ' + this.getUptime(),
            '     \x1b[34m/ossssssss/\x1b[0m        \x1b[34m+ssssooo/-\x1b[0m       ',
            '   \x1b[34m`/ossssso+/:-\x1b[0m        \x1b[34m-:/+osssso+-\x1b[0m     ',
            '  \x1b[34m`+sso+:-`\x1b[0m                 \x1b[34m`.-/+oso:\x1b[0m    ',
            ' \x1b[34m`++:.\x1b[0m                           \x1b[34m`-/+/\x1b[0m   ',
            ' \x1b[34m.`\x1b[0m                                 \x1b[34m`/\x1b[0m   '
        ];
        
        info.forEach(line => terminal.writeln(line));
    }

    /**
     * Get browser name from user agent
     */
    getBrowserName() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    /**
     * Get formatted uptime
     */
    getUptime() {
        const seconds = Math.floor(performance.now() / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
}

export default NeofetchCommand;
