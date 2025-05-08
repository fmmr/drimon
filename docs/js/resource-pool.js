/**
 * @file resource-pool.js
 * @description Resource pooling system for shared objects
 * 
 * This module provides object pooling for frequently created objects
 * to reduce memory allocation and garbage collection pressure.
 */

'use strict';

/**
 * @namespace ResourcePool
 * @description Manages pools of reusable objects to reduce memory allocation
 */
window.ResourcePool = {
    /**
     * Resource pools for different object types
     * @private
     */
    _pools: {},
    
    /**
     * Pool statistics for performance monitoring
     * @private
     */
    _stats: {
        created: {},
        acquired: {},
        released: {},
        size: {}
    },
    
    /**
     * Initialize a resource pool for a specific object type
     * @param {string} poolName - Name of the pool
     * @param {Function} factory - Function to create new objects
     * @param {Function} reset - Function to reset objects before reuse
     * @param {number} initialSize - Initial pool size (default: 0)
     * @param {number} maxSize - Maximum pool size (default: 50)
     * @returns {Object} Pool interface
     */
    createPool: function(poolName, factory, reset, initialSize = 0, maxSize = 50) {
        if (!poolName || typeof factory !== 'function') {
            console.error('Invalid pool configuration');
            return null;
        }
        
        // Check if pool already exists
        if (this._pools[poolName]) {
            console.warn(`Pool '${poolName}' already exists, returning existing pool`);
            return this._pools[poolName];
        }
        
        // Create pool
        const pool = {
            name: poolName,
            items: [],
            inUse: new Set(),
            factory: factory,
            reset: reset || function(item) { return item; },
            maxSize: maxSize
        };
        
        // Initialize pool with objects
        for (let i = 0; i < initialSize; i++) {
            const item = factory();
            if (item) {
                pool.items.push(item);
            }
        }
        
        // Initialize stats
        this._stats.created[poolName] = initialSize;
        this._stats.acquired[poolName] = 0;
        this._stats.released[poolName] = 0;
        this._stats.size[poolName] = initialSize;
        
        // Store pool in registry
        this._pools[poolName] = pool;
        
        // Return pool interface for fluent API
        return {
            acquire: (customReset) => this.acquire(poolName, customReset),
            release: (item) => this.release(poolName, item),
            clear: () => this.clearPool(poolName),
            getStats: () => this.getPoolStats(poolName)
        };
    },
    
    /**
     * Get or create a pool
     * @param {string} poolName - Name of the pool
     * @returns {Object|null} Pool interface or null if not found
     */
    getPool: function(poolName) {
        const pool = this._pools[poolName];
        if (!pool) {
            return null;
        }
        
        return {
            acquire: (customReset) => this.acquire(poolName, customReset),
            release: (item) => this.release(poolName, item),
            clear: () => this.clearPool(poolName),
            getStats: () => this.getPoolStats(poolName)
        };
    },
    
    /**
     * Acquire an object from the pool
     * @param {string} poolName - Name of the pool
     * @param {Function} customReset - Optional custom reset function
     * @returns {Object} Pooled object
     */
    acquire: function(poolName, customReset) {
        const pool = this._pools[poolName];
        if (!pool) {
            console.error(`Pool '${poolName}' does not exist`);
            return null;
        }
        
        let item;
        
        // Try to get an item from the pool
        if (pool.items.length > 0) {
            item = pool.items.pop();
        } else {
            // Create a new item if pool is empty
            item = pool.factory();
            this._stats.created[poolName]++;
        }
        
        // Reset the item before use
        if (typeof customReset === 'function') {
            item = customReset(item);
        } else if (typeof pool.reset === 'function') {
            item = pool.reset(item);
        }
        
        // Mark item as in use
        pool.inUse.add(item);
        
        // Update stats
        this._stats.acquired[poolName]++;
        this._stats.size[poolName] = pool.items.length;
        
        return item;
    },
    
    /**
     * Release an object back to the pool
     * @param {string} poolName - Name of the pool
     * @param {Object} item - Object to release
     * @returns {boolean} Success flag
     */
    release: function(poolName, item) {
        const pool = this._pools[poolName];
        if (!pool) {
            console.error(`Pool '${poolName}' does not exist`);
            return false;
        }
        
        // Check if item is actually from this pool
        if (!pool.inUse.has(item)) {
            console.warn(`Item not from pool '${poolName}', ignoring`);
            return false;
        }
        
        // Remove from in-use set
        pool.inUse.delete(item);
        
        // Only add back to pool if we haven't reached max size
        if (pool.items.length < pool.maxSize) {
            pool.items.push(item);
        }
        
        // Update stats
        this._stats.released[poolName]++;
        this._stats.size[poolName] = pool.items.length;
        
        return true;
    },
    
    /**
     * Clear a pool and release all objects
     * @param {string} poolName - Name of the pool
     * @returns {boolean} Success flag
     */
    clearPool: function(poolName) {
        const pool = this._pools[poolName];
        if (!pool) {
            console.error(`Pool '${poolName}' does not exist`);
            return false;
        }
        
        // Clear pool
        pool.items = [];
        pool.inUse.clear();
        
        // Update stats
        this._stats.size[poolName] = 0;
        
        return true;
    },
    
    /**
     * Get pool statistics
     * @param {string} poolName - Name of the pool
     * @returns {Object} Pool statistics
     */
    getPoolStats: function(poolName) {
        if (!poolName) {
            // Return stats for all pools
            return {
                pools: Object.keys(this._pools),
                totalCreated: Object.values(this._stats.created).reduce((sum, value) => sum + value, 0),
                totalAcquired: Object.values(this._stats.acquired).reduce((sum, value) => sum + value, 0),
                totalReleased: Object.values(this._stats.released).reduce((sum, value) => sum + value, 0),
                totalSize: Object.values(this._stats.size).reduce((sum, value) => sum + value, 0),
                poolStats: Object.keys(this._pools).reduce((stats, name) => {
                    stats[name] = this.getPoolStats(name);
                    return stats;
                }, {})
            };
        }
        
        const pool = this._pools[poolName];
        if (!pool) {
            return null;
        }
        
        return {
            name: poolName,
            available: pool.items.length,
            inUse: pool.inUse.size,
            totalCreated: this._stats.created[poolName] || 0,
            totalAcquired: this._stats.acquired[poolName] || 0,
            totalReleased: this._stats.released[poolName] || 0,
            hitRate: this._calculateHitRate(poolName),
            maxSize: pool.maxSize
        };
    },
    
    /**
     * Calculate hit rate for a pool (percentage of acquisitions that were served from the pool)
     * @private
     * @param {string} poolName - Name of the pool
     * @returns {number} Hit rate percentage
     */
    _calculateHitRate: function(poolName) {
        const acquired = this._stats.acquired[poolName] || 0;
        const created = this._stats.created[poolName] || 0;
        
        if (acquired === 0) {
            return 0;
        }
        
        // Exclude initial creations from hit rate calculation
        const initialSize = created - Math.max(0, acquired - this._stats.released[poolName]);
        const hitRate = (acquired - (created - initialSize)) / acquired * 100;
        
        return Math.max(0, hitRate);
    }
};

/**
 * Pre-configured pools for common chart components
 */
document.addEventListener('DOMContentLoaded', () => {
    // Create a pool for chart configuration objects
    window.ResourcePool.createPool('chartOptions', 
        // Factory function for creating new chart options
        function() {
            return {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: { padding: {} },
                scales: { x: {}, y: {} },
                plugins: {}
            };
        },
        // Reset function to prepare options for reuse
        function(options) {
            // Clear all properties but keep the structure
            options.layout.padding = {};
            options.scales = { x: {}, y: {} };
            options.plugins = {};
            return options;
        },
        // Initial pool size
        5,
        // Maximum pool size
        20
    );
    
    // Create a pool for dataset configuration objects
    window.ResourcePool.createPool('datasetConfig',
        // Factory function for creating new dataset configs
        function() {
            return {
                data: [],
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderColor: '#000000',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.1,
                fill: false
            };
        },
        // Reset function to prepare dataset config for reuse
        function(config) {
            config.data = [];
            config.backgroundColor = 'rgba(0, 0, 0, 0)';
            config.borderColor = '#000000';
            config.borderWidth = 2;
            config.pointRadius = 0;
            config.pointHoverRadius = 5;
            config.tension = 0.1;
            config.fill = false;
            delete config.label;
            delete config.yAxisID;
            return config;
        },
        // Initial pool size
        10,
        // Maximum pool size
        30
    );
    
    // Create a pool for tooltip configurations
    window.ResourcePool.createPool('tooltipConfig',
        // Factory function for creating new tooltip configs
        function() {
            return {
                mode: 'index',
                intersect: false,
                titleFont: { size: 11 },
                bodyFont: { size: 11 },
                padding: 6,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                callbacks: {}
            };
        },
        // Reset function to prepare tooltip config for reuse
        function(config) {
            config.callbacks = {};
            return config;
        },
        // Initial pool size
        5,
        // Maximum pool size
        10
    );
    
    // Create a pool for color arrays
    window.ResourcePool.createPool('colorArray',
        // Factory function for creating new color arrays
        function() {
            return [];
        },
        // Reset function to clear the array
        function(array) {
            array.length = 0;
            return array;
        },
        // Initial pool size
        5,
        // Maximum pool size
        20
    );
    
    // Create a pool for DOM elements (used for temporary elements)
    window.ResourcePool.createPool('domElements',
        // Factory function for creating new DOM elements (default to div)
        function() {
            return document.createElement('div');
        },
        // Reset function to clear the element
        function(element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            element.className = '';
            element.id = '';
            element.style.cssText = '';
            
            // Remove all attributes
            while (element.attributes.length > 0) {
                element.removeAttribute(element.attributes[0].name);
            }
            
            return element;
        },
        // Initial pool size
        5,
        // Maximum pool size
        20
    );
    
    console.debug('ResourcePool: Pre-configured pools created successfully');
});