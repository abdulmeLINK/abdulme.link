/**
 * SoundCommand - Control terminal sound effects
 */
class SoundCommand {
    async execute(args, terminal) {
        if (!terminal.soundService) {
            terminal.writeError('Sound service not available');
            return;
        }

        // No arguments - show status
        if (args.length === 0) {
            terminal.writeln('');
            terminal.writeln('\x1b[36m╭─────────────────────────────────────────╮\x1b[0m');
            terminal.writeln('\x1b[36m│         Sound Settings                  │\x1b[0m');
            terminal.writeln('\x1b[36m╰─────────────────────────────────────────╯\x1b[0m');
            terminal.writeln('');
            
            const status = terminal.soundService.enabled ? '\x1b[32mEnabled\x1b[0m' : '\x1b[31mDisabled\x1b[0m';
            terminal.writeln(`  Status: ${status}`);
            terminal.writeln(`  Volume: ${Math.round(terminal.soundService.volume * 100)}%`);
            terminal.writeln('');
            terminal.writeln('\x1b[36mCommands:\x1b[0m');
            terminal.writeln('  \x1b[33msound on\x1b[0m       Enable sound effects');
            terminal.writeln('  \x1b[33msound off\x1b[0m      Disable sound effects');
            terminal.writeln('  \x1b[33msound toggle\x1b[0m   Toggle sound on/off');
            terminal.writeln('  \x1b[33msound volume <0-100>\x1b[0m  Set volume');
            terminal.writeln('  \x1b[33msound test\x1b[0m     Play test beeps');
            terminal.writeln('  \x1b[33msound boot\x1b[0m     Play boot sound');
            terminal.writeln('  \x1b[33msound typing\x1b[0m   Play typing sounds');
            terminal.writeln('');
            return;
        }

        const command = args[0].toLowerCase();

        switch (command) {
            case 'on':
            case 'enable':
                terminal.soundService.enabled = true;
                terminal.soundService.savePreference();
                terminal.writeSuccess('✓ Sound effects enabled');
                terminal.soundService.playBeep(terminal.currentTheme);
                break;

            case 'off':
            case 'disable':
                terminal.soundService.enabled = false;
                terminal.soundService.savePreference();
                terminal.writeSuccess('✓ Sound effects disabled');
                break;

            case 'toggle':
                const newState = terminal.soundService.toggle();
                const stateText = newState ? 'enabled' : 'disabled';
                terminal.writeSuccess(`✓ Sound effects ${stateText}`);
                if (newState) {
                    terminal.soundService.playBeep(terminal.currentTheme);
                }
                break;

            case 'volume':
                if (args.length < 2) {
                    terminal.writeError('Usage: sound volume <0-100>');
                    return;
                }
                
                const volume = parseInt(args[1]);
                if (isNaN(volume) || volume < 0 || volume > 100) {
                    terminal.writeError('Volume must be between 0 and 100');
                    return;
                }
                
                terminal.soundService.setVolume(volume / 100);
                terminal.writeSuccess(`✓ Volume set to ${volume}%`);
                terminal.soundService.playBeep(terminal.currentTheme);
                break;

            case 'test':
                terminal.writeInfo('Playing test sounds...');
                setTimeout(() => terminal.soundService.playBeep(terminal.currentTheme), 100);
                setTimeout(() => terminal.soundService.playBeep(terminal.currentTheme), 400);
                setTimeout(() => terminal.soundService.playBeep(terminal.currentTheme), 700);
                break;

            case 'boot':
                terminal.writeInfo(`Playing ${terminal.currentTheme} boot sequence...`);
                terminal.soundService.playBootSound(terminal.currentTheme);
                break;

            case 'typing':
                terminal.writeInfo('Playing typing sounds...');
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        terminal.soundService.playKeypressSound(terminal.currentTheme);
                    }, i * 100);
                }
                break;

            default:
                terminal.writeError(`sound: unknown command '${command}'`);
                terminal.writeInfo('Type \'sound\' for help');
        }
    }
}

export default SoundCommand;
