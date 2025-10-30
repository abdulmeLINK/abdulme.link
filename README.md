# AbdulmeLink Portfolio

[![Laravel](https://img.shields.io/badge/Laravel-10.x-FF2D20?style=flat&logo=laravel)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.1+-777BB4?style=flat&logo=php)](https://php.net)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=flat&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An immersive web-based portfolio that recreates the authentic macOS desktop experience. Explore projects, interact with a terminal, and navigate through a pixel-perfect Apple interface—all within your browser.

## ✨ Features

- **Authentic macOS Desktop**: Pixel-perfect recreation of Apple's interface with genuine behaviors, animations, and interactions
- **Boot Sequence**: Dynamic loading with contextual messages and session persistence
- **Dock Interface**: Magnification, drag-to-rearrange, and Force Quit menus (Control+Shift)
- **Terminal Emulator**: Full xterm.js integration with authentic shortcuts and file system simulation
- **Wallpaper Gallery**: 27 high-quality wallpapers with progressive loading and time-based switching
- **Preferences System**: Comprehensive settings across 6 categories with live previews and localStorage persistence
- **Responsive Design**: Optimized for desktop and mobile, respecting accessibility preferences
- **Performance Optimized**: <3s initial load, 60fps animations, <100MB memory usage

## 🛠 Tech Stack

- **Backend**: Laravel 10.x (PHP 8.1+)
- **Frontend**: ES6 JavaScript, PostCSS, Sass
- **Terminal**: xterm.js with addons
- **Build Tool**: Laravel Mix with Webpack
- **Data Storage**: JSON files (no database required)
- **Architecture**: Services pattern, EventBus communication, Proxy-based state management

## 🚀 Quick Start

### Prerequisites
- PHP 8.1 or higher
- Composer
- Node.js & npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/abdulme.link.git
   cd abdulme.link
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node dependencies**
   ```bash
   npm install
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Supabase Setup** (Loosely-Coupled/Optional - for contact forms and data sync)
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Create the following storage buckets:
     - `portfolio-data` (public)
     - `portfolio-assets` (public) 
     - `portfolio-projects` (public)
   - Add to your `.env` file:
     ```
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_KEY=your-service-role-key
     ```
   - Sync data to Supabase:
     ```bash
     php artisan supabase:sync --type=all
     ```

6. **Build assets**
   ```bash
   npm run dev
   # or for production
   npm run prod
   ```

6. **Serve the application**
   ```bash
   php artisan serve --port=8000
   ```

7. **Open in browser**
   Navigate to `http://localhost:8000`

## 📁 Project Structure

```
abdulme.link/
├── app/                    # Laravel backend (Services pattern)
│   └── Services/          # Business logic layer
├── resources/
│   ├── js/components/     # Frontend components
│   ├── css/              # Stylesheets
│   └── views/            # Blade templates
├── public/                # Compiled assets and static files
├── storage/data/          # JSON data storage
├── routes/                # API and web routes
└── AI-ROADMAP.md         # Development roadmap
```

## 🤝 Contributing

This project uses AI-assisted development. Follow the phases outlined in `AI-ROADMAP.md`:

1. Read your assigned feature file in `resources/views/.features/`
2. Implement following the coding standards in `.github/copilot-instructions.md`
3. Test for authenticity, performance, and responsiveness
4. Update progress in `AI-ROADMAP.md`

### Development Guidelines
- **File Size Limits**: JS ≤200 lines, CSS ≤300 lines, PHP ≤150 lines
- **Naming**: PascalCase (components), camelCase (variables), kebab-case (CSS)
- **Communication**: EventBus only between components
- **Performance**: 60fps animations, <100ms interaction response

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Laravel framework
- Terminal powered by xterm.js
- Inspired by Apple's design philosophy
- AI-assisted development for authentic recreation

---

