# Feature Implementation Index

This directory contains detailed, AI-agent optimized feature specifications for each page/component. Each file is designed to fit within AI context windows while providing complete implementation guidance.

## View Feature Files

### Core Interface
- **`desktop.md`** - Boot animation, wallpaper system, desktop icons, context menus
- **`dock.md`** - Dock interface, magnification, app management, context menus  
- **`preferences.md`** - System settings, 6 categories, live previews, persistence

### Application Views
- **`terminal.md`** - xterm.js terminal, macOS shortcuts, commands, file system
- **`portfolio.md`** - Project grid, filtering, search, modals, GitHub integration
- **`about.md`** - Profile, skills, timeline, GitHub integration, resume
- **`contact.md`** - Contact form, validation, social integration, CAPTCHA

### Special Features
- **`face-recognition.md`** - Camera interface, AI analysis, celebrity matching

## Usage for AI Agents

### Context Window Optimization
- Each file: 50-80 lines (highly compressed)
- Scoped to specific components via `applyTo` frontmatter
- Implementation details with code examples
- Performance targets and QA criteria included

### Implementation Priority
1. **Phase 1**: desktop.md, dock.md (core macOS experience)
2. **Phase 2**: terminal.md, portfolio.md (main functionality) 
3. **Phase 3**: about.md, contact.md, preferences.md (supporting pages)
4. **Phase 4**: face-recognition.md (advanced features)

### Development Workflow
1. AI agent reads relevant feature file
2. Follows implementation specifications exactly
3. Uses provided data structures and API patterns
4. Implements performance requirements
5. Tests against QA criteria

## Benefits
- **Focused Context**: Agents only load relevant features
- **Reduced Hallucination**: Specific implementation details provided
- **Consistent Results**: Templates and patterns standardized
- **Efficient Development**: No time spent understanding large specifications