# Preferences View Features

---
applyTo: "resources/views/preferences.blade.php", "resources/js/components/preferences/*.js"
---

## System Preferences

### Preferences Window
- [ ] macOS-style window with tabbed interface
- [ ] 6 categories: Appearance, Desktop, Dock, Terminal, Performance, Privacy
- [ ] Live previews for all changes
- [ ] Settings apply instantly (<300ms)
- [ ] Persist via localStorage + IndexedDB

### Appearance Tab
- [ ] Theme selector: Light, Dark, Auto, Custom
- [ ] Color picker for accent colors
- [ ] Transparency level slider (0-100%)
- [ ] Custom theme creator with live preview
- [ ] Font size options for accessibility

### Desktop Tab  
- [ ] Wallpaper grid with thumbnails (200x125px)
- [ ] Categories by macOS version, favorites
- [ ] Auto-rotation toggle, interval selector (15min-6hrs)
- [ ] Time-based switching toggle
- [ ] Icon size: small/medium/large preview
- [ ] Grid spacing adjustment

### Dock Tab
- [ ] Position diagram: bottom/left/right
- [ ] Size slider with live dock preview
- [ ] Magnification toggle + scale setting
- [ ] Auto-hide checkbox
- [ ] Recently used apps count spinner
- [ ] App management grid (add/remove dock items)

### Terminal Tab
- [ ] Theme selector: Matrix, Amber, White, Custom
- [ ] Font dropdown: Menlo, Monaco, Fira Code
- [ ] Font size slider (10px-24px) with preview
- [ ] Effects toggles: scanlines, flicker, CRT
- [ ] Color pickers for background/foreground/cursor
- [ ] History size setting (100-10000 lines)

### Performance Tab
- [ ] Boot animation enable/disable
- [ ] Skip boot after session toggle
- [ ] Animation speed: Slow/Normal/Fast/Off
- [ ] Cache size limit slider with usage bar
- [ ] Preload components checkboxes
- [ ] Memory usage display
- [ ] Clear cache button

### Privacy Tab
- [ ] Analytics tracking toggle
- [ ] Anonymous usage data toggle  
- [ ] Remember session checkbox
- [ ] Restore window positions toggle
- [ ] Export/import settings buttons
- [ ] Clear browsing data button

### Implementation
- Use `PreferencesService` for all settings
- Emit `preference:changed` events via EventBus
- Validate all inputs before saving
- Show loading states during apply
- Provide reset to defaults option