/**
 * EventBus - Global event system for component communication
 * Provides publish/subscribe pattern for decoupled architecture
 */
class EventBus {
    constructor() {
        this.events = new Map();
        this.debugMode = window.location.search.includes('debug=true');
    }

    /**
     * Subscribe to an event
     * @param {string} event Event name
     * @param {Function} callback Event handler
     * @param {Object} options Subscription options
     */
    on(event, callback, options = {}) {
        if (typeof callback !== 'function') {
            console.error(`EventBus: Invalid callback for event "${event}"`);
            return () => {};
        }

        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }

        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0,
            id: Symbol('listener')
        };

        this.events.get(event).add(listener);

        if (this.debugMode) {
            console.log(`EventBus: Subscribed to "${event}"`, { options, listenerId: listener.id });
        }

        // Return unsubscribe function
        return () => this.off(event, listener.id);
    }

    /**
     * Subscribe to event once
     * @param {string} event Event name
     * @param {Function} callback Event handler
     */
    once(event, callback) {
        return this.on(event, callback, { once: true });
    }

    /**
     * Unsubscribe from event
     * @param {string} event Event name
     * @param {Symbol} listenerId Listener ID
     */
    off(event, listenerId) {
        if (!this.events.has(event)) return;

        const listeners = this.events.get(event);
        const listener = Array.from(listeners).find(l => l.id === listenerId);
        
        if (listener) {
            listeners.delete(listener);
            
            if (this.debugMode) {
                console.log(`EventBus: Unsubscribed from "${event}"`, { listenerId });
            }

            // Clean up empty event sets
            if (listeners.size === 0) {
                this.events.delete(event);
            }
        }
    }

    /**
     * Emit event to all subscribers
     * @param {string} event Event name
     * @param {*} data Event data
     */
    emit(event, data = null) {
        if (!this.events.has(event)) {
            if (this.debugMode) {
                console.log(`EventBus: No listeners for "${event}"`);
            }
            return;
        }

        const listeners = Array.from(this.events.get(event))
            .sort((a, b) => b.priority - a.priority); // Higher priority first

        if (this.debugMode) {
            console.log(`EventBus: Emitting "${event}"`, { data, listenerCount: listeners.length });
        }

        listeners.forEach(listener => {
            try {
                listener.callback(data, event);

                // Remove one-time listeners
                if (listener.once) {
                    this.events.get(event).delete(listener);
                }
            } catch (error) {
                console.error(`EventBus: Error in listener for "${event}":`, error);
            }
        });

        // Clean up empty event sets
        if (this.events.get(event).size === 0) {
            this.events.delete(event);
        }
    }

    /**
     * Get all active event subscriptions
     * @returns {Object} Event subscription summary
     */
    getActiveEvents() {
        const summary = {};
        
        this.events.forEach((listeners, event) => {
            summary[event] = listeners.size;
        });

        return summary;
    }

    /**
     * Clear all event subscriptions
     */
    clear() {
        this.events.clear();
        
        if (this.debugMode) {
            console.log('EventBus: Cleared all subscriptions');
        }
    }

    /**
     * Enable/disable debug mode
     * @param {boolean} enabled Debug mode state
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}

// Global instance
window.EventBus = new EventBus();

export default window.EventBus;