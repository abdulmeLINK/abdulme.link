# Dock Interface Features

---
applyTo: "resources/js/components/macos/Dock.js"
---

## Dock Functionality

### Core Dock
- [ ] 7 app icons with spring physics animation
- [ ] Translucent background: rgba(0,0,0,0.3), 16px blur
- [ ] Icons scale 1.0 to 1.5x on hover (<50ms response)
- [ ] Magnetic effect radius 100px, smooth interpolation
- [ ] Position options: bottom, left, right edge

### Magnification
- [ ] Neighboring icons scale proportionally (1.2x, 1.1x)
- [ ] Mouse distance calculation, natural physics
- [ ] Control+Shift toggles magnification on/off
- [ ] Smooth scale transitions, no jittery movement

### Context Menus
- [ ] Control-click shows context menu
- [ ] Options: "Keep in Dock", "Remove from Dock"
- [ ] Force Quit for hung applications
- [ ] Right-click app-specific options

### App Management
- [ ] Drag-to-rearrange functionality
- [ ] Add apps by dragging to dock area
- [ ] Remove by dragging out until "Remove" appears
- [ ] Separator lines for recently used apps
- [ ] Red notification badges for alerts

### Visual Effects
- [ ] Icons lift with subtle shadow on hover
- [ ] App labels appear above (fade in 200ms)
- [ ] Bounce animations for notifications/launches
- [ ] Indicator dots for running applications
- [ ] Smooth spring bounce (0.3s duration)

### Default Apps
```javascript
const dockApps = [
  'finder', 'terminal', 'portfolio', 
  'about', 'contact', 'preferences'
];
```

### Preferences Integration
- [ ] Auto-hide dock option
- [ ] Size adjustment (32px-128px)
- [ ] Recently used apps count (0-10)
- [ ] Magnification enable/disable
- [ ] Position preference persistence

### Performance
- [ ] 60fps smooth animations
- [ ] <100ms hover response time
- [ ] Memory efficient icon management
- [ ] Proper event cleanup on destroy