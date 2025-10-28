/**
 * Landing Page JavaScript Component
 * Handles carousel interactions, smooth transitions, and progressive enhancements
 * Pure vanilla JS - no dependencies
 */

class LandingPage {
    constructor() {
        // Carousel elements
        this.carousel = document.getElementById('portfolioCarousel');
        this.prevBtn = document.getElementById('carouselPrev');
        this.nextBtn = document.getElementById('carouselNext');
        this.indicators = document.getElementById('carouselIndicators');
        
        // CTA button
        this.ctaButton = document.getElementById('enterDesktopBtn');
        
        // State
        this.currentIndex = 0;
        this.totalSlides = 0;
        this.isAnimating = false;
        this.autoplayInterval = null;
        
        this.init();
    }
    
    /**
     * Initialize component
     */
    init() {
        if (!this.carousel) return;
        
        this.totalSlides = this.carousel.children.length;
        
        // Setup event listeners
        this.setupCarousel();
        this.setupCTA();
        this.setupKeyboardNavigation();
        
        // Start autoplay
        this.startAutoplay();
        
        console.log('Landing Page initialized', {
            slides: this.totalSlides,
            autoplay: true
        });
    }
    
    /**
     * Setup carousel functionality
     */
    setupCarousel() {
        if (!this.prevBtn || !this.nextBtn) return;
        
        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.previousSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        // Indicator buttons
        if (this.indicators) {
            const indicatorButtons = this.indicators.querySelectorAll('.indicator');
            indicatorButtons.forEach((button, index) => {
                button.addEventListener('click', () => this.goToSlide(index));
            });
        }
        
        // Touch/swipe support
        this.setupTouchEvents();
        
        // Pause autoplay on hover
        this.carousel.addEventListener('mouseenter', () => this.stopAutoplay());
        this.carousel.addEventListener('mouseleave', () => this.startAutoplay());
    }
    
    /**
     * Setup touch/swipe events for mobile
     */
    setupTouchEvents() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        this.carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }
    
    /**
     * Handle swipe gesture
     */
    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) < swipeThreshold) return;
        
        if (diff > 0) {
            this.nextSlide();
        } else {
            this.previousSlide();
        }
    }
    
    /**
     * Go to next slide
     */
    nextSlide() {
        if (this.isAnimating) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
        this.updateCarousel();
    }
    
    /**
     * Go to previous slide
     */
    previousSlide() {
        if (this.isAnimating) return;
        
        this.currentIndex = this.currentIndex === 0 ? this.totalSlides - 1 : this.currentIndex - 1;
        this.updateCarousel();
    }
    
    /**
     * Go to specific slide
     */
    goToSlide(index) {
        if (this.isAnimating || index === this.currentIndex) return;
        
        this.currentIndex = index;
        this.updateCarousel();
    }
    
    /**
     * Update carousel position and indicators
     */
    updateCarousel() {
        this.isAnimating = true;
        
        // Calculate slide width (considering gap)
        const slideWidth = this.carousel.children[0].offsetWidth;
        const gap = 32; // 2rem gap
        const offset = -(this.currentIndex * (slideWidth + gap));
        
        // Apply transform with smooth transition
        this.carousel.style.transform = `translateX(${offset}px)`;
        
        // Update indicators
        this.updateIndicators();
        
        // Reset animation flag
        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    }
    
    /**
     * Update indicator active state
     */
    updateIndicators() {
        if (!this.indicators) return;
        
        const indicatorButtons = this.indicators.querySelectorAll('.indicator');
        indicatorButtons.forEach((button, index) => {
            if (index === this.currentIndex) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    /**
     * Start autoplay
     */
    startAutoplay() {
        this.stopAutoplay(); // Clear existing interval
        
        this.autoplayInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // 5 seconds
    }
    
    /**
     * Stop autoplay
     */
    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }
    
    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard if carousel is visible
            const carouselRect = this.carousel.getBoundingClientRect();
            if (carouselRect.top > window.innerHeight || carouselRect.bottom < 0) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    this.nextSlide();
                    break;
            }
        });
    }
    
    /**
     * Setup CTA button with smooth transition
     */
    setupCTA() {
        if (!this.ctaButton) return;
        
        this.ctaButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.smoothTransitionToDesktop();
        });
    }
    
    /**
     * Smooth transition to desktop experience
     */
    smoothTransitionToDesktop() {
        // Add transitioning class
        document.body.classList.add('transitioning-to-desktop');
        
        // Create fade overlay
        const overlay = document.createElement('div');
        overlay.className = 'transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0a0a0a;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        document.body.appendChild(overlay);
        
        // Trigger fade in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        
        // Navigate after fade completes
        setTimeout(() => {
            window.location.href = this.ctaButton.href;
        }, 600);
    }
    
    /**
     * Cleanup on destroy
     */
    destroy() {
        this.stopAutoplay();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.landingPage = new LandingPage();
    });
} else {
    window.landingPage = new LandingPage();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.landingPage) {
        window.landingPage.destroy();
    }
});
