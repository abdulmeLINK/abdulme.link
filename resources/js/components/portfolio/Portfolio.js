/**
 * Portfolio Application Component - REMASTERED v3.0.0
 * 
 * Complete rebuild with:
 * - Proper scroll container architecture
 * - Fixed search icon positioning
 * - Clean technology tags layout
 * - Working card click navigation
 * - Enhanced modal with carousel
 * - Smooth animations and transitions
 * - Theme-aware design
 * 
 * @author AbdulmeLink Portfolio
 * @version 3.0.0 (Remastered)
 */

import EventBus from '../EventBus.js';
import ThemeService from '../../services/ThemeService.js';

export default class Portfolio {
    constructor(container) {
        this.container = container;
        this.projects = [];
        this.filteredProjects = [];
        this.categories = {};
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.searchTimeout = null;
        
        // Modal state
        this.currentProject = null;
        this.currentImageIndex = 0;
        
        // Lazy loading
        this.imageObserver = null;
        this.observedImages = new Set();
        
        this.init();
    }

    /**
     * Initialize portfolio
     */
    async init() {
        try {
            this.showLoading();
            await this.loadData();
            this.render();
            this.attachEvents();
            // Lazy loading removed - using direct src loading for better performance
            this.hideLoading();
            
            EventBus.emit('portfolio:ready', { 
                projectCount: this.projects.length 
            });
            
            console.log('✅ Portfolio Remastered - Loaded', this.projects.length, 'projects');
            
        } catch (error) {
            console.error('❌ Portfolio initialization failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.container.innerHTML = `
            <div class="portfolio-loading">
                <div class="spinner"></div>
                <p>Loading amazing projects...</p>
            </div>
        `;
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = this.container.querySelector('.portfolio-loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.remove(), 300);
        }
    }

    /**
     * Load portfolio data from API
     */
    async loadData() {
        const response = await fetch('/api/portfolio');
        if (!response.ok) throw new Error('Failed to load portfolio data');
        
        const result = await response.json();
        if (!result.success) throw new Error('Invalid API response');
        
        this.projects = result.data.data || [];
        this.categories = result.data.meta?.categories || {};
        this.filteredProjects = [...this.projects];
        
        // Load Supabase image URLs for projects (async, non-blocking)
        this.loadProjectImages();
    }

    /**
     * Load project images from Supabase with local fallback (non-blocking)
     */
    loadProjectImages() {
        // Start image loading in background without blocking app initialization
        this.loadProjectImagesAsync().then(() => {
            // Update filtered projects when images are loaded
            this.filteredProjects = [...this.projects];
            
            // Update existing DOM images with new URLs
            this.updateExistingImages();
            
            // If we're currently showing filtered results, update the grid
            if (this.currentFilter !== 'all' || this.searchQuery) {
                this.updateGrid();
            }
            
            EventBus.emit('portfolio:images-loaded', { 
                projectCount: this.projects.length 
            });
            
            console.log('✅ Portfolio images loaded from Supabase');
        }).catch(error => {
            console.warn('Failed to load project images from Supabase, using local paths:', error);
        });
    }

    /**
     * Async image loading logic (runs in background)
     */
    async loadProjectImagesAsync() {
        // Process projects in parallel for better performance
        const imagePromises = this.projects.map(async (project) => {
            try {
                const response = await fetch(`/api/images/project/${project.id}`);
                if (!response.ok) {
                    console.warn(`Failed to load images for project ${project.id}, using local paths`);
                    return project; // Return original project with local paths
                }
                
                const result = await response.json();
                if (!result.success) {
                    console.warn(`Invalid response for project ${project.id} images, using local paths`);
                    return project;
                }
                
                // Update project with Supabase URLs where available
                const updatedProject = { ...project };
                
                if (result.data.thumbnail) {
                    updatedProject.images = updatedProject.images || {};
                    updatedProject.images.thumbnail = result.data.thumbnail;
                    updatedProject.images._thumbnailSource = result.data._metadata?.thumbnailSource || 'local';
                }
                
                if (result.data.gallery && result.data.gallery.length > 0) {
                    updatedProject.images = updatedProject.images || {};
                    updatedProject.images.gallery = result.data.gallery.map(item => item.url);
                    updatedProject.images._gallerySource = result.data.gallery[0]?.source || 'local';
                }
                
                console.log(`Loaded ${result.data.gallery?.length || 0} images for project ${project.id} from ${result.data._metadata?.thumbnailSource || 'local'}`);
                return updatedProject;
                
            } catch (error) {
                console.warn(`Error loading images for project ${project.id}:`, error);
                return project; // Return original project with local paths
            }
        });
        
        // Wait for all image loading to complete
        this.projects = await Promise.all(imagePromises);
    }

    /**
     * Initialize lazy loading with Intersection Observer
     */
    initLazyLoading() {
        // Create Intersection Observer for lazy loading
        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    this.imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px', // Start loading 50px before image enters viewport
            threshold: 0.1
        });
        
        // Observe all lazy images
        this.observeLazyImages();
    }

    /**
     * Observe all lazy images in the container
     */
    observeLazyImages() {
        const lazyImages = this.container.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            if (!this.observedImages.has(img)) {
                this.imageObserver.observe(img);
                this.observedImages.add(img);
            }
        });
    }

    /**
     * Update existing DOM images with new URLs after async loading
     */
    updateExistingImages() {
        this.projects.forEach(project => {
            const projectCard = this.container.querySelector(`[data-project-id="${project.id}"]`);
            if (projectCard && project.images?.thumbnail) {
                const img = projectCard.querySelector('.card-image');
                if (img && img.src !== project.images.thumbnail) {
                    img.src = project.images.thumbnail;
                }
            }
        });
    }

    /**
     * Render complete portfolio UI
     */
    render() {
        this.container.className = 'portfolio-container';
        this.container.innerHTML = `
            <!-- Fixed Header -->
            <header class="portfolio-header">
                <div class="header-content">
                    <div class="header-title">
                        <h1>My Projects</h1>
                        <p class="subtitle">${this.projects.length} projects showcasing full-stack development</p>
                    </div>
                    
                    <div class="header-controls">
                        <!-- Search Box -->
                        <div class="search-box">
                            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input 
                                type="text" 
                                class="search-input" 
                                placeholder="Search projects, technologies..."
                                autocomplete="off"
                            >
                            <button class="search-clear hidden" aria-label="Clear search">×</button>
                        </div>
                        
                        <!-- Category Filters -->
                        <div class="category-filters">
                            <button class="filter-chip active" data-category="all">
                                <span class="chip-count">${this.projects.length}</span>
                                All
                            </button>
                            ${this.renderCategoryFilters()}
                        </div>
                    </div>
                </div>
            </header>

            <!-- Scrollable Content Area -->
            <main class="portfolio-main">
                <div class="projects-grid" id="projectsGrid">
                    ${this.renderProjects()}
                </div>
                
                <div class="empty-state hidden" id="emptyState">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <h3>No projects found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            </main>

            <!-- Modal -->
            <div class="portfolio-modal hidden" id="portfolioModal">
                <div class="modal-backdrop"></div>
                <div class="modal-wrapper">
                    <div class="modal-content">
                        <button class="modal-close" aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                        <div class="modal-body" id="modalBody"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render category filter chips
     */
    renderCategoryFilters() {
        if (!this.categories || typeof this.categories !== 'object') {
            return '';
        }
        
        return Object.values(this.categories)
            .filter(cat => cat && cat.id && cat.name) // Filter out invalid categories
            .map(cat => {
                const count = this.projects.filter(p => p.category === cat.id).length;
                const color = cat.color || '#007AFF'; // Fallback color
                return `
                    <button class="filter-chip" data-category="${cat.id}" style="--chip-color: ${color}">
                        <span class="chip-count">${count}</span>
                        ${cat.name}
                    </button>
                `;
            }).join('');
    }

    /**
     * Render project cards
     */
    renderProjects() {
        if (this.filteredProjects.length === 0) return '';
        
        return this.filteredProjects.map((project, index) => {
            const category = this.categories[project.category] || {};
            const thumbnail = project.images?.thumbnail || this.getPlaceholder();
            
            return `
                <article class="project-card" data-project-id="${project.id}" style="--card-delay: ${index * 50}ms; --category-color: ${category.color}">
                    <div class="card-image">
                        <img src="${thumbnail}" alt="${project.title}" class="card-image" onerror="this.src='${this.getPlaceholder()}'">
                        <div class="card-overlay">
                            <button class="view-btn">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                                View Details
                            </button>
                        </div>
                        ${project.featured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
                        ${this.getStatusBadge(project.status)}
                    </div>
                    
                    <div class="card-body">
                        <div class="card-header">
                            <span class="category-tag" style="background: ${category.color}20; color: ${category.color}">
                                ${category.name || 'Other'}
                            </span>
                        </div>
                        
                        <h3 class="card-title">${project.title}</h3>
                        <p class="card-description">${this.truncate(project.description, 100)}</p>
                        
                        <div class="card-footer">
                            <div class="tech-stack">
                                ${this.renderCardTags(project)}
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    /**
     * Render card tags (technologies + custom tags)
     */
    renderCardTags(project) {
        const allTags = [
            ...(project.technologies || []),
            ...(project.tags || [])
        ];
        
        const displayTags = allTags.slice(0, 3);
        const remaining = allTags.length - 3;
        
        return `
            ${displayTags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
            ${remaining > 0 ? `<span class="tech-tag more">+${remaining}</span>` : ''}
        `;
    }

    /**
     * Attach all event listeners
     */
    attachEvents() {
        // Search input
        const searchInput = this.container.querySelector('.search-input');
        const searchClear = this.container.querySelector('.search-clear');
        
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            searchClear.classList.toggle('hidden', !this.searchQuery);
            
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.applyFilters(), 300);
        });
        
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            this.searchQuery = '';
            searchClear.classList.add('hidden');
            this.applyFilters();
        });

        // Category filters
        this.container.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFilter = chip.dataset.category;
                this.applyFilters();
            });
        });

        // Project cards - click to open modal
        this.container.addEventListener('click', (e) => {
            const card = e.target.closest('.project-card');
            if (card) {
                const projectId = card.dataset.projectId;
                this.openModal(projectId);
            }
        });

        // Modal close
        const modal = this.container.querySelector('#portfolioModal');
        const modalClose = modal.querySelector('.modal-close');
        const modalBackdrop = modal.querySelector('.modal-backdrop');
        
        modalClose.addEventListener('click', () => this.closeModal());
        modalBackdrop.addEventListener('click', () => this.closeModal());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('hidden')) {
                if (e.key === 'Escape') this.closeModal();
                if (e.key === 'ArrowLeft') this.prevImage();
                if (e.key === 'ArrowRight') this.nextImage();
            }
        });
    }

    /**
     * Apply search and category filters
     */
    applyFilters() {
        let filtered = [...this.projects];
        
        // Category filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(p => p.category === this.currentFilter);
        }
        
        // Search filter
        if (this.searchQuery) {
            filtered = filtered.filter(p => {
                const searchText = [
                    p.title,
                    p.description,
                    p.category,
                    ...(p.technologies || []),
                    ...(p.highlights || [])
                ].join(' ').toLowerCase();
                
                return searchText.includes(this.searchQuery);
            });
        }
        
        this.filteredProjects = filtered;
        this.updateGrid();
    }

    /**
     * Update projects grid
     */
    updateGrid() {
        const grid = this.container.querySelector('#projectsGrid');
        const emptyState = this.container.querySelector('#emptyState');
        
        if (this.filteredProjects.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            grid.innerHTML = this.renderProjects();
            
            // Animate cards
            requestAnimationFrame(() => {
                grid.querySelectorAll('.project-card').forEach(card => {
                    card.classList.add('visible');
                });
            });
            
            // Observe new lazy images
            this.observeLazyImages();
        }
    }

    /**
     * Open project modal
     */
    openModal(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        
        this.currentProject = project;
        this.currentImageIndex = 0;
        
        const modal = this.container.querySelector('#portfolioModal');
        const modalBody = modal.querySelector('#modalBody');
        
        modalBody.innerHTML = this.renderModalContent(project);
        modal.classList.remove('hidden');
        
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Attach modal-specific events
        this.attachModalEvents();
    }

    /**
     * Render modal content
     */
    renderModalContent(project) {
        const category = this.categories[project.category] || {};
        const images = project.images?.gallery || [];
        const videos = project.images?.videos || [];
        
        // Handle both old format (array of strings) and new format (array of objects)
        const processedImages = images.map(img => {
            if (typeof img === 'string') {
                return { type: 'image', src: img };
            } else if (typeof img === 'object' && img.url) {
                return { type: 'image', src: img.url };
            }
            return null;
        }).filter(Boolean);
        
        const galleryItems = [
            ...processedImages,
            ...videos.map(vid => ({ type: 'video', src: vid }))
        ];
        const hasGallery = galleryItems.length > 0;
        
        return `
            <div class="modal-grid ${!hasGallery ? 'no-gallery' : ''}">
                ${hasGallery ? `
                    <div class="modal-gallery">
                        <div class="gallery-viewer">
                            ${galleryItems[this.currentImageIndex].type === 'image' ? `
                                <img 
                                    src="${galleryItems[this.currentImageIndex].src || this.getPlaceholder()}" 
                                    alt="${project.title}"
                                    class="gallery-image"
                                    onerror="this.src='${this.getPlaceholder()}'"
                                >
                            ` : `
                                <iframe 
                                    src="${galleryItems[this.currentImageIndex].src}" 
                                    class="gallery-video"
                                    title="YouTube video player" 
                                    frameborder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    referrerpolicy="strict-origin-when-cross-origin" 
                                    allowfullscreen>
                                </iframe>
                            `}
                            ${galleryItems.length > 1 ? `
                                <button class="gallery-nav prev" data-nav="prev">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                </button>
                                <button class="gallery-nav next" data-nav="next">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </button>
                                <div class="gallery-indicator">${this.currentImageIndex + 1} / ${galleryItems.length}</div>
                            ` : ''}
                        </div>
                        
                        ${galleryItems.length > 1 ? `
                            <div class="gallery-thumbs">
                                ${galleryItems.map((item, idx) => `
                                    ${item.type === 'image' ? `
                                        <img 
                                            src="${item.src || this.getPlaceholder()}" 
                                            alt="Thumbnail ${idx + 1}"
                                            class="thumb ${idx === this.currentImageIndex ? 'active' : ''}"
                                            data-index="${idx}"
                                            onerror="this.src='${this.getPlaceholder()}'"
                                        >
                                    ` : `
                                        <div 
                                            class="thumb video-thumb ${idx === this.currentImageIndex ? 'active' : ''}"
                                            data-index="${idx}"
                                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
                                            <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                        </div>
                                    `}
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="modal-info">
                    <div class="info-header">
                        <span class="category-badge" style="background: ${category.color}20; color: ${category.color}">
                            ${category.name || 'Project'}
                        </span>
                        ${project.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
                    </div>
                    
                    <h2 class="modal-title">${project.title}</h2>
                    <p class="modal-description">${project.description}</p>
                    
                    ${project.highlights?.length ? `
                        <div class="highlights-section">
                            <h4>Key Achievements</h4>
                            <ul class="highlights-list">
                                ${project.highlights.map(h => `<li>${h}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${(project.technologies?.length || project.tags?.length) ? `
                        <div class="tech-section">
                            ${project.technologies?.length ? `
                                <h4>Technologies</h4>
                                <div class="tech-grid">
                                    ${project.technologies.map(tech => 
                                        `<span class="tech-badge">${tech}</span>`
                                    ).join('')}
                                </div>
                            ` : ''}
                            
                            ${project.tags?.length ? `
                                <h4 style="margin-top: ${project.technologies?.length ? '1rem' : '0'}">Tags</h4>
                                <div class="tech-grid">
                                    ${project.tags.map(tag => 
                                        `<span class="tech-badge custom-tag">${tag}</span>`
                                    ).join('')}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="actions-section">
                        ${project.links?.demo ? `
                            <a href="${project.links.demo}" target="_blank" rel="noopener" class="action-button primary">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                                </svg>
                                ${project.category === 'certification' ? 'View Certificate' : 'View Live Demo'}
                            </a>
                        ` : ''}
                        ${project.links?.youtube ? `
                            <a href="${project.links.youtube}" target="_blank" rel="noopener" class="action-button primary">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                                Watch on YouTube
                            </a>
                        ` : ''}
                        ${project.links?.website ? `
                            <a href="${project.links.website}" target="_blank" rel="noopener" class="action-button primary">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="2" y1="12" x2="22" y2="12"/>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                </svg>
                                View Website
                            </a>
                        ` : ''}
                        ${project.links?.github ? `
                            <a href="${project.links.github}" target="_blank" rel="noopener" class="action-button secondary">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
                                </svg>
                                Source Code
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach modal-specific events
     */
    attachModalEvents() {
        const modal = this.container.querySelector('#portfolioModal');
        
        // Gallery navigation
        modal.querySelectorAll('.gallery-nav').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.nav === 'prev') this.prevImage();
                else this.nextImage();
            });
        });
        
        // Thumbnail clicks
        modal.querySelectorAll('.thumb').forEach(thumb => {
            thumb.addEventListener('click', () => {
                this.currentImageIndex = parseInt(thumb.dataset.index);
                this.updateGallery();
            });
        });
    }

    /**
     * Navigate to previous image
     */
    prevImage() {
        if (!this.currentProject) return;
        const images = this.currentProject.images?.gallery || [];
        const videos = this.currentProject.images?.videos || [];
        const totalItems = images.length + videos.length;
        if (totalItems <= 1) return;
        
        this.currentImageIndex = (this.currentImageIndex - 1 + totalItems) % totalItems;
        this.updateGallery();
    }

    /**
     * Navigate to next image
     */
    nextImage() {
        if (!this.currentProject) return;
        const images = this.currentProject.images?.gallery || [];
        const videos = this.currentProject.images?.videos || [];
        const totalItems = images.length + videos.length;
        if (totalItems <= 1) return;
        
        this.currentImageIndex = (this.currentImageIndex + 1) % totalItems;
        this.updateGallery();
    }

    /**
     * Update gallery image and thumbs
     */
    updateGallery() {
        const modal = this.container.querySelector('#portfolioModal');
        const viewer = modal.querySelector('.gallery-viewer');
        const indicator = modal.querySelector('.gallery-indicator');
        const thumbs = modal.querySelectorAll('.thumb');
        
        const images = this.currentProject.images?.gallery || [];
        const videos = this.currentProject.images?.videos || [];
        
        // Handle both old format (array of strings) and new format (array of objects)
        const processedImages = images.map(img => {
            if (typeof img === 'string') {
                return { type: 'image', src: img };
            } else if (typeof img === 'object' && img.url) {
                return { type: 'image', src: img.url };
            }
            return null;
        }).filter(Boolean);
        
        const galleryItems = [
            ...processedImages,
            ...videos.map(vid => ({ type: 'video', src: vid }))
        ];
        
        if (viewer) {
            const currentItem = galleryItems[this.currentImageIndex];
            if (currentItem.type === 'image') {
                viewer.innerHTML = `
                    <img 
                        src="${currentItem.src || this.getPlaceholder()}" 
                        alt="${this.currentProject.title}"
                        class="gallery-image"
                        onerror="this.src='${this.getPlaceholder()}'"
                    >
                `;
            } else {
                viewer.innerHTML = `
                    <iframe 
                        src="${currentItem.src}" 
                        class="gallery-video"
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerpolicy="strict-origin-when-cross-origin" 
                        allowfullscreen>
                    </iframe>
                `;
            }
            
            // Re-add navigation buttons
            if (galleryItems.length > 1) {
                viewer.innerHTML += `
                    <button class="gallery-nav prev" data-nav="prev">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="gallery-nav next" data-nav="next">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <div class="gallery-indicator">${this.currentImageIndex + 1} / ${galleryItems.length}</div>
                `;
                
                // Re-attach nav events
                viewer.querySelectorAll('.gallery-nav').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (btn.dataset.nav === 'prev') this.prevImage();
                        else this.nextImage();
                    });
                });
            }
        }
        
        if (indicator) {
            indicator.textContent = `${this.currentImageIndex + 1} / ${galleryItems.length}`;
        }
        
        thumbs.forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === this.currentImageIndex);
        });
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = this.container.querySelector('#portfolioModal');
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            this.currentProject = null;
            this.currentImageIndex = 0;
        }, 300);
    }

    /**
     * Get status badge HTML
     */
    getStatusBadge(status) {
        const badges = {
            'live': '<div class="status-badge live">Live</div>',
            'completed': '<div class="status-badge completed">Completed</div>',
            'in-progress': '<div class="status-badge progress">In Progress</div>',
            'archived': '<div class="status-badge archived">Archived</div>'
        };
        return badges[status] || '';
    }

    /**
     * Get placeholder image
     */
    getPlaceholder() {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea'/%3E%3Cstop offset='100%25' style='stop-color:%23764ba2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='500' fill='url(%23g)'/%3E%3Cg transform='translate(400,250)'%3E%3Crect x='-50' y='-50' width='100' height='100' rx='10' fill='white' opacity='0.2'/%3E%3Ccircle cx='-20' cy='-20' r='10' fill='white' opacity='0.4'/%3E%3Cpath d='M50 30L20 0L-30 50L50 50Z' fill='white' opacity='0.4'/%3E%3C/g%3E%3C/svg%3E";
    }

    /**
     * Truncate text
     */
    truncate(text, length) {
        if (!text || text.length <= length) return text || '';
        return text.substring(0, length).trim() + '...';
    }

    /**
     * Show error state
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="portfolio-error">
                <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-button">Retry</button>
            </div>
        `;
    }
}
