/**
 * SupabaseDataService.js - Frontend data service for Supabase
 * Handles all data fetching with caching and real-time subscriptions
 */

import { supabase } from './SupabaseClient';
import Dexie from 'dexie';

/**
 * IndexedDB cache using Dexie.js
 */
const db = new Dexie('AbdulmeLinkCache');
db.version(1).stores({
    about: 'id, timestamp',
    portfolio: 'project_id, timestamp',
    preferences: 'user_id, timestamp',
    terminal_commands: 'command, timestamp',
    desktop_apps: 'app_id, timestamp'
});

/**
 * SupabaseDataService - Manages data fetching with offline support
 */
export class SupabaseDataService {
    constructor() {
        this.cacheTime = 3600000; // 1 hour in milliseconds
        this.subscriptions = new Map();
    }

    /**
     * Get about data with caching
     */
    async getAbout() {
        try {
            // Try cache first
            const cached = await db.about.get(1);
            if (cached && Date.now() - cached.timestamp < this.cacheTime) {
                console.log('[Supabase] Returning cached about data');
                return cached.data;
            }

            // Fetch from Supabase
            const { data, error } = await supabase
                .from('about')
                .select('*')
                .single();

            if (error) throw error;

            // Update cache
            await db.about.put({
                id: 1,
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('[Supabase] Failed to get about:', error);
            
            // Return cache as fallback
            const cached = await db.about.get(1);
            return cached?.data || null;
        }
    }

    /**
     * Get portfolio projects with filtering
     */
    async getPortfolioProjects(filters = {}) {
        try {
            let query = supabase.from('portfolio_projects').select('*');

            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            if (filters.featured !== undefined) {
                query = query.eq('featured', filters.featured);
            }

            query = query.order('order_index', { ascending: true });

            const { data, error } = await query;

            if (error) throw error;

            // Cache individual projects
            for (const project of data) {
                await db.portfolio.put({
                    project_id: project.project_id,
                    data: project,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            console.error('[Supabase] Failed to get portfolio:', error);
            
            // Return cache as fallback
            const cached = await db.portfolio.toArray();
            return cached.map(c => c.data);
        }
    }

    /**
     * Get user preferences
     */
    async getUserPreferences(userId = 'default') {
        try {
            const cached = await db.preferences.get(userId);
            if (cached && Date.now() - cached.timestamp < this.cacheTime) {
                return cached.data;
            }

            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            await db.preferences.put({
                user_id: userId,
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('[Supabase] Failed to get preferences:', error);
            
            const cached = await db.preferences.get(userId);
            return cached?.data || null;
        }
    }

    /**
     * Update user preferences (optimistic update)
     */
    async updateUserPreferences(userId, preferences) {
        try {
            // Optimistic update - update cache first
            await db.preferences.put({
                user_id: userId,
                data: preferences,
                timestamp: Date.now()
            });

            // Send to Supabase
            const { error } = await supabase
                .from('user_preferences')
                .update(preferences)
                .eq('user_id', userId);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('[Supabase] Failed to update preferences:', error);
            return false;
        }
    }

    /**
     * Get terminal commands
     */
    async getTerminalCommands(enabledOnly = true) {
        try {
            let query = supabase.from('terminal_commands').select('*');

            if (enabledOnly) {
                query = query.eq('enabled', true);
            }

            query = query.order('order_index', { ascending: true });

            const { data, error } = await query;

            if (error) throw error;

            // Cache commands
            for (const command of data) {
                await db.terminal_commands.put({
                    command: command.command,
                    data: command,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            console.error('[Supabase] Failed to get terminal commands:', error);
            
            const cached = await db.terminal_commands.toArray();
            return cached.map(c => c.data);
        }
    }

    /**
     * Get desktop apps
     */
    async getDesktopApps() {
        try {
            const { data, error } = await supabase
                .from('desktop_apps')
                .select('*')
                .order('dock_position', { ascending: true });

            if (error) throw error;

            // Cache apps
            for (const app of data) {
                await db.desktop_apps.put({
                    app_id: app.app_id,
                    data: app,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            console.error('[Supabase] Failed to get desktop apps:', error);
            
            const cached = await db.desktop_apps.toArray();
            return cached.map(c => c.data);
        }
    }

    /**
     * Subscribe to real-time updates on a table
     */
    subscribeToTable(table, callback) {
        const subscription = supabase
            .channel(`public:${table}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table },
                (payload) => {
                    console.log(`[Supabase] Real-time update on ${table}:`, payload);
                    callback(payload);
                    
                    // Clear cache for this table
                    this.clearTableCache(table);
                }
            )
            .subscribe();

        this.subscriptions.set(table, subscription);
        return subscription;
    }

    /**
     * Unsubscribe from real-time updates
     */
    unsubscribe(table) {
        const subscription = this.subscriptions.get(table);
        if (subscription) {
            supabase.removeChannel(subscription);
            this.subscriptions.delete(table);
        }
    }

    /**
     * Clear cache for a specific table
     */
    async clearTableCache(table) {
        try {
            if (db[table]) {
                await db[table].clear();
            }
        } catch (error) {
            console.error(`[Supabase] Failed to clear cache for ${table}:`, error);
        }
    }

    /**
     * Clear all caches
     */
    async clearAllCache() {
        try {
            await db.delete();
            console.log('[Supabase] All caches cleared');
        } catch (error) {
            console.error('[Supabase] Failed to clear all caches:', error);
        }
    }

    /**
     * Check if we're online and can reach Supabase
     */
    async isOnline() {
        if (!navigator.onLine) {
            return false;
        }

        try {
            const { error } = await supabase.from('about').select('id').limit(1);
            return !error;
        } catch {
            return false;
        }
    }
}

// Export singleton instance
export default new SupabaseDataService();
