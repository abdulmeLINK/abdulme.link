# Desktop View Features

---
applyTo: "resources/views/desktop.blade.php", "resources/js/components/macos/Desktop.js"
---

## Core Desktop Features

### Boot Animation
- [ ] Dynamic progress tracking with real asset loading
- [ ] Status text rotation: "Loading wallpapers...", "Almost ready..."
- [ ] Session persistence: skip boot on return visits (localStorage)
- [ ] Profile photo (profile.jpg) with fade-in + scale
- [ ] 4-second duration, 60fps smooth animation

### Wallpaper System
- [ ] 27 macOS wallpapers with progressive loading
- [ ] Auto-rotation every 30min, manual right-click selection
- [ ] Time-based switching: light (6AM-6PM), dark (6PM-6AM)
- [ ] Compressed thumbnails (200x125px), WebP format
- [ ] Smooth crossfade transitions (1s duration)

### Desktop Icons
- [ ] 8 draggable icons with snap-to-grid positioning
- [ ] Physics-based movement, magnetic edges
- [ ] Hover effects: shadows follow mouse, 5° tilt
- [ ] Icon labels on/off toggle in preferences
- [ ] Collision detection, invalid drop return

### Context Menu
- [ ] Right-click desktop shows macOS-style menu
- [ ] Options: Change wallpaper, refresh, preferences
- [ ] Frosted glass effect, 8px border radius
- [ ] Appears <100ms, closes on outside click

### Performance
- [ ] 60fps animations, 30fps minimum mobile
- [ ] Wallpaper cache <100MB, automatic cleanup
- [ ] Lazy load non-critical desktop features
- [ ] Memory efficient icon management

### Implementation Notes
- Use `WallpaperService` for asset management
- Emit `wallpaper:changed` events via EventBus
- Store preferences in localStorage
- Progressive enhancement: core first, effects later