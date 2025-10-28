# Terminal View Features

---
applyTo: "resources/views/terminal.blade.php", "resources/js/components/terminal/*.js"
---

## Terminal Core Interface

### xterm.js Implementation
- [ ] Terminal emulation with fit, web-links, search addons
- [ ] 1000-line scrollback buffer with efficient memory management
- [ ] ANSI color support (256 colors), Matrix theme: #00ff41 on #000000
- [ ] Menlo/Monaco monospace font, 14px size, 1.2 line height
- [ ] Blinking cursor (1s interval), scanline effects, CRT simulation

### Authentic macOS Shortcuts
- [ ] Command+N: new window, Command+F: find, Command+K: clear scrollback
- [ ] Control+A: line beginning, Control+E: line end, Control+K: cut to end
- [ ] Control+U: cut to beginning, Control+W: delete word, Control+L: clear

### Core Commands (8 Essential)
- [ ] **ls**: Color-coded listing (blue dirs, white files), permissions, file sizes
- [ ] **cd**: Tab completion, path validation, support for ~, .., absolute paths
- [ ] **cat**: Syntax highlighting, line numbers, file content display
- [ ] **pwd**: Current directory in yellow, real-time path updates
- [ ] **clear**: Animated screen clear (300ms fade), preserve command history
- [ ] **help**: Formatted command list with descriptions and usage examples
- [ ] **whoami**: ASCII art profile, skills, contact info, social links
- [ ] **neofetch**: System info with custom logo, browser details, uptime

### Interactive Features
- [ ] Command history (up/down arrows), persistence across sessions
- [ ] Tab completion for commands, files, directories with fuzzy matching
- [ ] Real-time command suggestions and syntax highlighting
- [ ] File system simulation via filesystem.json structure

### Terminal Games (4 Games)
- [ ] **snake**: Arrow controls, score tracking, high scores in localStorage
- [ ] **tetris**: Block puzzle with rotation, level progression
- [ ] **typing**: WPM test with accuracy tracking, random text passages
- [ ] **2048**: Number puzzle with arrow key controls

### Performance & Polish
- [ ] <16ms command response, 60fps scrolling, memory efficient
- [ ] Error handling: red text for invalid commands, helpful suggestions
- [ ] Theme customization: Matrix/Amber/Terminal themes in preferences
- [ ] Integration: portfolio/about/contact commands open respective apps

## Implementation Notes
- Use CommandRegistry pattern for extensible command system
- Virtual file system loaded from filesystem.json
- Session state persistence for command history and current directory
- Progressive enhancement: core functionality first, games load later