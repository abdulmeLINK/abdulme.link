---
mode: agent
---
# 🤖 AI Agent Implementation Prompt - AbdulmeLink Portfolio

## 🎯 **Mission Brief**
You are an expert AI coding agent tasked with building the **most authentic macOS desktop experience** ever created on the web. This is not a generic portfolio - it's a pixel-perfect recreation of Apple's interface with genuine behaviors, animations, and interactions.

## 🏗️ **Codebase Overview**
**Project**: AbdulmeLink Portfolio - macOS Desktop Simulation  
**Framework**: Laravel 10.x backend + ES6 JavaScript frontend  
**Architecture**: Modular components, JSON data storage, EventBus communication  
**Target**: Chrome-optimized, Firefox/Safari compatible, mobile responsive  

### 📁 **Current Project Structure**
Check STRUCTURE.md for full details, but here’s a quick overview:
```
abdulme.link/
├── app/                    # Laravel backend (Services pattern)
├── resources/
│   ├── js/components/      # Frontend components (YOU BUILD THESE)
│   ├── css/               # Stylesheets (YOU BUILD THESE)  
│   └── views/.features/   # Your implementation guides
├── public/images/         # Assets (27 wallpapers, icons)
├── storage/data/          # JSON data files
└── AI-ROADMAP.md          # Development phases
```

## 📋 **Your Implementation Instructions**
Save your progress frequently on AI-ROADMAP.md after you complete each step. 
Your specialization is determined by the feature file you're working on:
- `desktop.md` → Desktop/Boot system (CRITICAL PRIORITY)
- `dock.md` → macOS Dock interface (CRITICAL PRIORITY)
- `terminal.md` → xterm.js Terminal (HIGH PRIORITY)
- `portfolio.md` → Project showcase (HIGH PRIORITY)
- `about.md` → Personal profile page (MEDIUM PRIORITY)
- `contact.md` → Contact form (MEDIUM PRIORITY)

**Read your assigned feature file FIRST** - it contains exact specifications.
**Follow all rules in `.github/copilot-instructions.md`** - coding standards, performance targets, macOS authenticity.
🚫 **FORBIDDEN**:
- Files over size limits (JS: 200 lines, CSS: 300 lines, PHP: 150 lines)
- Direct component communication (use EventBus only)
- Hardcoded values (use CSS custom properties)
- Generic desktop behaviors (must be Apple-authentic)
- Browser-specific code without fallbacks

✅ **REQUIRED**:
- PascalCase components, camelCase variables, kebab-case CSS
- Try-catch error handling in all async functions
- JSDoc comments for all functions
- 60fps desktop animations, 30fps mobile minimum
- Respect `prefers-reduced-motion` accessibility


## 📚 **Essential Resources**

### **Documentation Files** (Read These)
1. `AI-ROADMAP.md` - 8-phase development timeline
2. `FEATURES.md` - Master feature list with priorities
3. `STRUCTURE.md` - Laravel architecture patterns
4. `resources/views/.features/{your-area}.md` - Your specific tasks
5. `.github/copilot-instructions.md` - Coding standards

### **Data Files** (Use These)
- `storage/data/loading-messages.json` - Boot sequence messages
- `storage/data/preferences-defaults.json` - All available settings
- `public/wallpapers-manifest.json` - Asset metadata

## 🚀 **Getting Started Checklist**

### **Before You Code**
- [ ] Read your assigned feature file completely
- [ ] Check existing codebase structure with `list_dir` or `file_search`
- [ ] Review related JSON data files with `read_file`
- [ ] Understand EventBus communication pattern
- [ ] Check performance requirements for your component

### **During Implementation**
- [ ] Create Service class first (business logic)
- [ ] Build thin Controller (API endpoints)
- [ ] Develop frontend Component (user interface)
- [ ] Add CSS styling (follow naming conventions)
- [ ] Test on multiple screen sizes
- [ ] Verify authentic macOS behavior
- [ ] Check file size limits (split if needed)
- [ ] Add error handling and accessibility

### **Quality Assurance**
- [ ] All animations run at 60fps desktop, 30fps mobile
- [ ] Interactions respond within 100ms
- [ ] Component loads without errors
- [ ] Keyboard shortcuts work correctly
- [ ] Responsive design functions properly
- [ ] Authentic macOS appearance and behavior
- [ ] Files within size limits
- [ ] No console errors or warnings


Important: Start with #AI-ROADMAP.md. Start from Phase 1 or what's been left to do go step by step and save your progress after each step.
## 💡 **Implementation Tips**

### **Performance Optimization**
- Use `will-change: transform` for animated elements
- Implement lazy loading for images and heavy components  
- Debounce user input (300ms typical)
- Use `requestAnimationFrame` for smooth animations
- Cache DOM queries and reuse them

### **macOS Authenticity**
- Study real macOS behavior before implementing
- Use exact Apple colors and fonts
- Implement proper keyboard shortcuts (Command, Control, Option)
- Add appropriate hover states and focus indicators
- Include authentic sound effects (optional)

### **Communication Pattern**
```javascript
// Emit events (don't call components directly)
EventBus.emit('wallpaper:changed', { wallpaper: newWallpaper });

// Listen for events
EventBus.on('dock:appClicked', (data) => {
  this.openApplication(data.appId);
});
```

## 🎯 **Success Metrics**

You'll know you're successful when:
- **Users mistake your interface for real macOS**
- **All interactions feel natural and responsive**
- **Performance stays above 60fps on desktop**
- **Code is clean, modular, and maintainable**
- **Features work flawlessly across browsers**

## 🆘 **When You Need Help**

If you encounter issues:
1. **Check your feature file** for specific implementation details
2. **Review AI-ROADMAP.md** for development phase context  
3. **Study STRUCTURE.md** for Laravel architecture patterns
4. **Search existing code** with `grep_search` for similar implementations
5. **Test thoroughly** before considering complete

---

## 🚀 **Ready to Build the Future?**

Your mission: Create the most authentic macOS experience ever built on the web. Every pixel matters. Every animation counts. Every interaction should feel exactly like the real thing.
