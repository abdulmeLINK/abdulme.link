/**
 * PerformanceMonitor - Track and optimize performance
 * 
 * Monitors FPS, memory usage, load times, and provides
 * optimization suggestions
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            memory: [],
            loadTimes: {},
            interactions: []
        };
        
        this.fpsInterval = null;
        this.isMonitoring = false;
        this.targetFPS = 60;
        this.warningThreshold = 30;
    }

    /**
     * Start monitoring performance
     */
    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.startFPSMonitoring();
        this.trackLoadTimes();
        this.trackInteractions();
        
        console.log('Performance monitoring started');
    }

    /**
     * Stop monitoring
     */
    stop() {
        this.isMonitoring = false;
        
        if (this.fpsInterval) {
            clearInterval(this.fpsInterval);
            this.fpsInterval = null;
        }
        
        console.log('Performance monitoring stopped');
    }

    /**
     * Monitor FPS (Frames Per Second)
     */
    startFPSMonitoring() {
        let lastTime = performance.now();
        let frames = 0;

        const measureFPS = () => {
            const currentTime = performance.now();
            frames++;

            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                this.recordFPS(fps);
                
                frames = 0;
                lastTime = currentTime;

                // Warn if FPS drops below threshold
                if (fps < this.warningThreshold) {
                    console.warn(`Low FPS detected: ${fps}`);
                }
            }

            if (this.isMonitoring) {
                requestAnimationFrame(measureFPS);
            }
        };

        requestAnimationFrame(measureFPS);
    }

    /**
     * Record FPS measurement
     */
    recordFPS(fps) {
        this.metrics.fps.push({
            timestamp: Date.now(),
            value: fps
        });

        // Keep only last 100 measurements
        if (this.metrics.fps.length > 100) {
            this.metrics.fps.shift();
        }
    }

    /**
     * Track page load times
     */
    trackLoadTimes() {
        if (!window.performance || !window.performance.timing) {
            return;
        }

        const timing = window.performance.timing;
        
        this.metrics.loadTimes = {
            // Time to first byte
            ttfb: timing.responseStart - timing.requestStart,
            // DOM Content Loaded
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            // Full page load
            load: timing.loadEventEnd - timing.navigationStart,
            // DOM Interactive
            domInteractive: timing.domInteractive - timing.navigationStart
        };

        // Performance Navigation Timing API (newer)
        if (window.performance.getEntriesByType) {
            const navTiming = window.performance.getEntriesByType('navigation')[0];
            if (navTiming) {
                this.metrics.loadTimes.serverResponse = navTiming.responseEnd - navTiming.requestStart;
                this.metrics.loadTimes.domParsing = navTiming.domInteractive - navTiming.responseEnd;
            }
        }
    }

    /**
     * Track user interactions
     */
    trackInteractions() {
        const interactionTypes = ['click', 'keydown', 'scroll'];
        
        interactionTypes.forEach(type => {
            document.addEventListener(type, (e) => {
                this.recordInteraction(type, e);
            }, { passive: true });
        });
    }

    /**
     * Record interaction timing
     */
    recordInteraction(type, event) {
        const timestamp = performance.now();
        
        this.metrics.interactions.push({
            type,
            timestamp,
            target: event.target.tagName
        });

        // Keep only last 50 interactions
        if (this.metrics.interactions.length > 50) {
            this.metrics.interactions.shift();
        }
    }

    /**
     * Get memory usage (if available)
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            };
        }
        return null;
    }

    /**
     * Get average FPS
     */
    getAverageFPS() {
        if (this.metrics.fps.length === 0) return 0;
        
        const sum = this.metrics.fps.reduce((acc, item) => acc + item.value, 0);
        return Math.round(sum / this.metrics.fps.length);
    }

    /**
     * Get performance report
     */
    getReport() {
        return {
            fps: {
                average: this.getAverageFPS(),
                current: this.metrics.fps[this.metrics.fps.length - 1]?.value || 0,
                history: this.metrics.fps
            },
            memory: this.getMemoryUsage(),
            loadTimes: this.metrics.loadTimes,
            interactions: {
                count: this.metrics.interactions.length,
                recent: this.metrics.interactions.slice(-10)
            }
        };
    }

    /**
     * Log performance summary
     */
    logSummary() {
        const report = this.getReport();
        
        console.group('Performance Summary');
        console.log('Average FPS:', report.fps.average);
        console.log('Load Times:', report.loadTimes);
        console.log('Memory:', report.memory);
        console.log('Interactions:', report.interactions.count);
        console.groupEnd();
    }

    /**
     * Check if performance is acceptable
     */
    isPerformanceGood() {
        const avgFPS = this.getAverageFPS();
        const loadTime = this.metrics.loadTimes.load;
        
        return avgFPS >= this.targetFPS * 0.5 && loadTime < 3000;
    }

    /**
     * Get optimization suggestions
     */
    getOptimizationSuggestions() {
        const suggestions = [];
        const avgFPS = this.getAverageFPS();
        const loadTime = this.metrics.loadTimes.load;
        
        if (avgFPS < this.targetFPS * 0.8) {
            suggestions.push('Consider reducing animation complexity');
            suggestions.push('Enable hardware acceleration');
        }
        
        if (loadTime > 3000) {
            suggestions.push('Optimize image sizes and formats');
            suggestions.push('Enable code splitting and lazy loading');
        }
        
        const memory = this.getMemoryUsage();
        if (memory && parseFloat(memory.usedJSHeapSize) > 100) {
            suggestions.push('High memory usage detected - check for memory leaks');
        }
        
        return suggestions;
    }
}

// Export singleton instance
export default new PerformanceMonitor();
