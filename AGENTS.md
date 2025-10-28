# Multi-Agent Development Rules - AbdulmeLink Portfolio

## Agent Specializations

### 🎨 Frontend Agent
**Scope**: UI components, animations, user interactions
**Files**: `resources/js/components/`, `resources/css/`
**Rules**:
- Follow macOS design patterns exactly
- Implement GSAP animations with 60fps performance
- Use EventBus for component communication
- Maintain file size limits (JS: 200 lines, CSS: 300 lines)
- Consider atomizing if above the line limits
- Test responsiveness on mobile, tablet, desktop

### 🔧 Backend Agent  
**Scope**: Laravel services, APIs, data management
**Files**: `app/Services/`, `app/Http/Controllers/`, `routes/`
**Rules**:
- Thin controllers (≤300 lines), fat services pattern
- JSON data storage via DataService
- Comprehensive error handling with try-catch
- RESTful API responses with consistent structure
- No direct database queries - use JSON files

### 📊 Data Agent
**Scope**: JSON data structures, content management
**Files**: `storage/data/`, `public/wallpapers-manifest.json`
**Rules**:
- Validate all data schemas before saving
- Maintain referential integrity between files
- Keep files under 1MB for performance
- Use camelCase for property names
- Include metadata (version, timestamps, counts)

### 🔧 DevOps Agent
**Scope**: Build tools, optimization, deployment
**Files**: `webpack.mix.js`, `package.json`, build configs
**Rules**:
- Optimize bundle sizes with code splitting
- Configure lazy loading for large assets
- Set up proper caching strategies
- Ensure cross-browser compatibility
- Monitor performance metrics

## Collaboration Rules

### Communication Protocol
1. **State Changes**: Emit events via EventBus, never direct method calls
2. **Data Flow**: Backend → JSON → Frontend services → Components
3. **Asset Management**: Compress images, use WebP format if available, lazy load
4. **Error Handling**: Graceful degradation, user-friendly messages

### Quality Gates
- **Performance**: <3s initial load, 60fps animations, <100MB cache
- **Accessibility**: Keyboard navigation, screen reader support, reduced motion
- **Testing**: All features work offline, settings persist across sessions
- **Compatibility**: Chrome optimized, Firefox/Safari compatible

### File Dependencies
- Components depend on services, not other components
- Services use EventBus for communication
- JSON data accessed only via DataService
- CSS uses custom properties for theming
- All animations respect prefers-reduced-motion

## Critical Features Priority

### Phase 1 (Must Have)
1. Dynamic boot sequence with session persistence
2. 27 wallpaper system with progressive loading
3. Preferences panel with 6 categories, 80+ settings
4. macOS-authentic dock with magnification, drag-drop
5. Terminal with xterm.js, authentic shortcuts, file system

### Phase 2 (Enhancement) 
1. Advanced animations with GSAP Timeline
2. Terminal games (snake, typing test etc.)
3. Project detail modals with live demos
4. Theme creator with custom colors

Remember: Each agent starts with zero codebase knowledge. Follow .instructions.md feature & rule file if exists in working directory for specifications exactly. Maintain authentic macOS experience throughout.