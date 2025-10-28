# Portfolio View Features

---
applyTo: "resources/views/portfolio.blade.php", "resources/js/components/portfolio/*.js"
---

## Portfolio Display

### Project Grid
- [ ] CSS Grid with Masonry layout (4 cols desktop, 2 mobile)
- [ ] Responsive grid with auto-fit columns, 24px gaps
- [ ] Infinite scroll loading, lazy load images
- [ ] Card shadows: 0 4px 20px rgba(0,0,0,0.1)
- [ ] 12px border radius, smooth hover transitions

### Project Cards
- [ ] Thumbnail hover: scale 1.05x, overlay appears
- [ ] WebP images with JPEG fallback, lazy loading
- [ ] Title slides up from bottom on hover
- [ ] Technology badges with colored backgrounds
- [ ] GitHub stars/forks display via API

### Filtering & Search
- [ ] 6 categories: Web, Mobile, AI, Games, Tools, Other
- [ ] Real-time search with Fuse.js (titles, descriptions, tech)
- [ ] Animated filter transitions (300ms fade)
- [ ] Active filter highlighting with accent color
- [ ] Results counter, search term highlighting

### Sorting Options
- [ ] Date (newest/oldest), Category (A-Z), Tech Stack
- [ ] Maintains current filter while sorting
- [ ] Dropdown menu with checkmarks for active sort
- [ ] Sort completes within 500ms

### Project Details
- [ ] Modal windows with image carousels (Swiper.js)
- [ ] Live demo iframes with loading states
- [ ] Technology stack with hover tooltips
- [ ] GitHub integration: stars, forks, commits
- [ ] Project timeline visualization

### Performance
- [ ] Layout adapts within 200ms on resize
- [ ] Images load within 1s, hover response <50ms
- [ ] Search results update instantly
- [ ] Handles 100+ projects efficiently
- [ ] Modal opens within 200ms

### Data Structure
```json
{
  "id": "uuid", 
  "title": "Project Name",
  "category": "web|mobile|ai|games|tools",
  "technologies": ["Laravel", "Vue.js"],
  "images": {"thumbnail": "thumb.webp", "gallery": []},
  "links": {"demo": "url", "github": "url"},
  "featured": true
}
```