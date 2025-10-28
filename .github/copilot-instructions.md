# AI Agent Instructions - AbdulmeLink Portfolio

## 🎯 Core Mission
Build an authentic macOS desktop portfolio from scratch. Every component must replicate genuine Apple behaviors exactly. Zero tolerance for generic desktop simulations.

## 📏 File Size Limits (STRICT)
- **JavaScript components**: ≤200 lines (split if exceeded)
- **CSS files**: ≤300 lines (modular architecture required)
- **PHP classes**: ≤150 lines (thin controllers, fat services)
- **JSON data files**: ≤1MB (optimize and compress)

## 🏗 Architecture Rules
- **Services Pattern**: All business logic in `/app/Services/`, controllers thin
- **Component Communication**: EventBus only, no direct references between components
- **Data Storage**: JSON files in `/storage/data/`, no database queries
- **State Management**: Proxy-based reactive state, event-driven updates

## 🍎 macOS Authenticity Requirements
- **Dock Behavior**: Exact magnification (Control+Shift), drag-to-rearrange, Force Quit menus
- **Keyboard Shortcuts**: Apple documentation shortcuts only (Command+M minimize, Control+A line start)
- **Visual Design**: System colors (#007AFF), SF fonts, authentic shadows/borders
- **Animations**: Apple easing curves cubic-bezier(0.4,0,0.2,1), 60fps performance

## 🚀 Performance Standards
- **Loading**: <3s initial load, <1s subsequent navigation
- **Animations**: 60fps desktop, 30fps mobile minimum, respect prefers-reduced-motion
- **Memory**: <100MB total usage, efficient cleanup, no memory leaks
- **Responsiveness**: All interactions provide feedback <100ms

## 📝 Development Rules
- **Naming**: PascalCase (components), camelCase (variables), kebab-case (CSS/JSON)
- **Error Handling**: Try-catch in all async functions, graceful degradation
- **Documentation**: JSDoc comments for all functions, clear variable names
- **Testing**: Manual testing required, cross-browser compatibility

## 🔥 Key Features Priority
1. **Boot Sequence**: Dynamic progress, session persistence, contextual messages from loading-messages.json
2. **27 Wallpapers**: Progressive loading, time-based switching, thumbnail previews
3. **Preferences System**: 6 categories, 80+ settings, live previews, localStorage persistence
4. **Terminal**: xterm.js, authentic shortcuts, file system simulation, interactive commands

## 📚 Reference Files
- **AI-ROADMAP.md**: Complete development timeline and phase priorities
- **resources/views/.features/**: Component-specific implementation details
- **storage/data/preferences-defaults.json**: All available settings with defaults
- **public/wallpapers-manifest.json**: Asset metadata and optimization rules

## ❌ Forbidden Practices
- Direct DOM manipulation outside component scope
- Inline styles or hardcoded values (use CSS custom properties)
- Browser-specific code without fallbacks
- Generic desktop behaviors (must be Apple-authentic)
- Large bundle sizes (use code splitting)

Follow AI-ROADMAP.md for development phases. Consult feature files for implementation details. Build the most authentic macOS experience possible.