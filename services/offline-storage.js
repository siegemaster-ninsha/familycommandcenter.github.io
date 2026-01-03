// Offline Storage Service - IndexedDB wrapper for offline data caching
// Provides persistent storage for chores, family members, quicklist, and sync queue

class OfflineStorage {
  constructor() {
    this.dbName = 'FamilyCommandCenter';
    this.dbVersion = 2; // Bumped to add missing object stores (chores, familyMembers, quicklist)
    this.db = null;
    this.initPromise = null;
    this.persistentStorageGranted = false;
  }

  // Initialize IndexedDB connection
  async init() {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db) {
      return this.db;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        this.initPromise = null;
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[OK] IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this._createObjectStores(db);
      };
    });

    return this.initPromise;
  }

  // ==================== STORAGE MANAGEMENT ====================

  // Request persistent storage permission from browser
  // Returns: { granted: boolean, persisted: boolean }
  async requestPersistentStorage() {
    try {
      // Check if Storage API is available
      if (!navigator.storage || !navigator.storage.persist) {
        console.log('[WARN] Persistent storage API not available');
        return { granted: false, persisted: false, reason: 'API not available' };
      }

      // Check if already persisted
      const alreadyPersisted = await navigator.storage.persisted();
      if (alreadyPersisted) {
        console.log('[OK] Storage already persisted');
        this.persistentStorageGranted = true;
        return { granted: true, persisted: true };
      }

      // Request persistent storage
      const granted = await navigator.storage.persist();
      this.persistentStorageGranted = granted;
      
      if (granted) {
        console.log('[OK] Persistent storage granted');
        return { granted: true, persisted: true };
      } else {
        console.log('[WARN] Persistent storage denied (browser may auto-grant based on engagement)');
        return { granted: false, persisted: false, reason: 'Permission denied' };
      }
    } catch (error) {
      console.error('Error requesting persistent storage:', error);
      return { granted: false, persisted: false, reason: error.message };
    }
  }

  // Check if storage is persisted
  async isStoragePersisted() {
    try {
      if (!navigator.storage || !navigator.storage.persisted) {
        return false;
      }
      return await navigator.storage.persisted();
    } catch (error) {
      console.error('Error checking storage persistence:', error);
      return false;
    }
  }

  // Get storage quota information
  // Returns: { usage: number, quota: number, percentUsed: number }
  async getStorageQuota() {
    try {
      if (!navigator.storage || !navigator.storage.estimate) {
        return { usage: 0, quota: 0, percentUsed: 0, available: true };
      }

      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

      return {
        usage,
        quota,
        percentUsed,
        usageFormatted: this._formatBytes(usage),
        quotaFormatted: this._formatBytes(quota),
        available: percentUsed < 90 // Consider storage available if less than 90% used
      };
    } catch (error) {
      console.error('Error getting storage quota:', error);
      return { usage: 0, quota: 0, percentUsed: 0, available: true };
    }
  }

  // Format bytes to human readable string
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if there's enough storage before a write operation
  // estimatedSize: estimated size of data to write in bytes
  async checkStorageBeforeWrite(estimatedSize = 0) {
    try {
      const quota = await this.getStorageQuota();
      
      // If we can't get quota info, assume it's okay
      if (quota.quota === 0) {
        return { canWrite: true, quota };
      }

      const availableSpace = quota.quota - quota.usage;
      const canWrite = availableSpace > estimatedSize;

      if (!canWrite) {
        console.warn(`[WARN] Storage quota low: ${quota.usageFormatted} / ${quota.quotaFormatted} used`);
      }

      return { canWrite, quota, availableSpace };
    } catch (error) {
      console.error('Error checking storage before write:', error);
      return { canWrite: true, quota: null }; // Assume okay on error
    }
  }

  // Evict oldest cached data when storage is low
  // Returns number of items evicted
  async evictOldestData(targetBytesToFree = 1024 * 1024) {
    console.log(`[CLEANUP] Evicting oldest data to free ${this._formatBytes(targetBytesToFree)}...`);
    
    let evictedCount = 0;
    
    try {
      await this._ensureDb();
      
      // Get timestamps for each data type
      const timestamps = await Promise.all([
        this.getLastSyncTime('chores'),
        this.getLastSyncTime('familyMembers'),
        this.getLastSyncTime('quicklist')
      ]);

      // Sort by oldest first
      const dataTypes = [
        { type: 'chores', timestamp: timestamps[0] || 0 },
        { type: 'familyMembers', timestamp: timestamps[1] || 0 },
        { type: 'quicklist', timestamp: timestamps[2] || 0 }
      ].sort((a, b) => a.timestamp - b.timestamp);

      // Evict oldest data first until we've freed enough space
      for (const { type } of dataTypes) {
        const quotaBefore = await this.getStorageQuota();
        
        await this._transaction(type, 'readwrite', (store) => {
          store.clear();
        });
        
        // Clear the timestamp too
        await this._transaction('metadata', 'readwrite', (store) => {
          store.delete(`${type}_cached_at`);
        });
        
        evictedCount++;
        console.log(`[CLEANUP] Evicted ${type} cache`);
        
        const quotaAfter = await this.getStorageQuota();
        const freedBytes = quotaBefore.usage - quotaAfter.usage;
        
        if (freedBytes >= targetBytesToFree) {
          console.log(`[OK] Freed ${this._formatBytes(freedBytes)}`);
          break;
        }
      }
    } catch (error) {
      console.error('Error evicting data:', error);
    }

    return evictedCount;
  }

  // Handle QuotaExceededError gracefully
  async handleQuotaExceeded(operation, retryFn) {
    console.warn('[WARN] Storage quota exceeded, attempting to free space...');
    
    try {
      // Try to evict old data
      const evicted = await this.evictOldestData();
      
      if (evicted > 0 && retryFn) {
        console.log('[RETRY] Retrying operation after eviction...');
        return await retryFn();
      }
      
      throw new Error('Unable to free enough storage space');
    } catch (error) {
      console.error('Failed to handle quota exceeded:', error);
      throw error;
    }
  }


  // Create object stores during database upgrade
  _createObjectStores(db) {
    // Chores store
    if (!db.objectStoreNames.contains('chores')) {
      const choresStore = db.createObjectStore('chores', { keyPath: 'id' });
      choresStore.createIndex('assignedTo', 'assignedTo', { unique: false });
      choresStore.createIndex('completed', 'completed', { unique: false });
      choresStore.createIndex('updatedAt', 'updatedAt', { unique: false });
    }

    // Family members store
    if (!db.objectStoreNames.contains('familyMembers')) {
      const membersStore = db.createObjectStore('familyMembers', { keyPath: 'id' });
      membersStore.createIndex('displayName', 'displayName', { unique: false });
      membersStore.createIndex('userId', 'userId', { unique: false });
    }

    // Quicklist store
    if (!db.objectStoreNames.contains('quicklist')) {
      const quicklistStore = db.createObjectStore('quicklist', { keyPath: 'id' });
      quicklistStore.createIndex('name', 'name', { unique: false });
    }

    // Sync queue store for offline modifications
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncStore.createIndex('type', 'type', { unique: false });
      syncStore.createIndex('status', 'status', { unique: false });
    }

    // Metadata store for cache timestamps and settings
    if (!db.objectStoreNames.contains('metadata')) {
      db.createObjectStore('metadata', { keyPath: 'key' });
    }

    console.log('[OK] IndexedDB object stores created');
  }

  // Ensure database is initialized before operations
  async _ensureDb() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  // Generic transaction helper with error handling
  async _transaction(storeName, mode, operation) {
    const db = await this._ensureDb();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        
        transaction.onerror = (event) => {
          console.error(`Transaction error on ${storeName}:`, event.target.error);
          reject(event.target.error);
        };

        const result = operation(store);
        
        if (result && result.onsuccess !== undefined) {
          result.onsuccess = () => resolve(result.result);
          result.onerror = (event) => reject(event.target.error);
        } else {
          transaction.oncomplete = () => resolve(result);
        }
      } catch (error) {
        console.error(`Error in ${storeName} transaction:`, error);
        reject(error);
      }
    });
  }


  // ==================== CHORE OPERATIONS ====================

  // Cache chores with timestamp
  async cacheChores(chores) {
    // Estimate size and check quota before write
    const estimatedSize = JSON.stringify(chores).length * 2; // Rough estimate
    const { canWrite } = await this.checkStorageBeforeWrite(estimatedSize);
    
    if (!canWrite) {
      // Try to evict old data first
      await this.evictOldestData(estimatedSize);
    }

    const db = await this._ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chores', 'metadata'], 'readwrite');
      const choresStore = transaction.objectStore('chores');
      const metadataStore = transaction.objectStore('metadata');

      transaction.onerror = (event) => {
        const error = event.target.error;
        // Handle QuotaExceededError
        if (error && (error.name === 'QuotaExceededError' || error.code === 22)) {
          console.warn('[WARN] QuotaExceededError while caching chores');
          this.handleQuotaExceeded('cacheChores', () => this.cacheChores(chores))
            .then(resolve)
            .catch(reject);
          return;
        }
        console.error('Error caching chores:', error);
        reject(error);
      };

      transaction.oncomplete = () => {
        console.log(`[OK] Cached ${chores.length} chores`);
        resolve();
      };

      // Clear existing chores and add new ones
      choresStore.clear();
      chores.forEach(chore => {
        // Convert reactive proxy to plain object for IndexedDB storage
        const plainChore = JSON.parse(JSON.stringify(chore));
        choresStore.add(plainChore);
      });

      // Update cache timestamp
      metadataStore.put({
        key: 'chores_cached_at',
        value: Date.now()
      });
    });
  }

  // Get cached chores
  async getCachedChores() {
    return this._transaction('chores', 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (event) => reject(event.target.error);
      });
    });
  }

  // ==================== FAMILY MEMBER OPERATIONS ====================

  // Cache family members with timestamp
  async cacheFamilyMembers(members) {
    // Estimate size and check quota before write
    const estimatedSize = JSON.stringify(members).length * 2;
    const { canWrite } = await this.checkStorageBeforeWrite(estimatedSize);
    
    if (!canWrite) {
      await this.evictOldestData(estimatedSize);
    }

    const db = await this._ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['familyMembers', 'metadata'], 'readwrite');
      const membersStore = transaction.objectStore('familyMembers');
      const metadataStore = transaction.objectStore('metadata');

      transaction.onerror = (event) => {
        const error = event.target.error;
        if (error && (error.name === 'QuotaExceededError' || error.code === 22)) {
          console.warn('[WARN] QuotaExceededError while caching family members');
          this.handleQuotaExceeded('cacheFamilyMembers', () => this.cacheFamilyMembers(members))
            .then(resolve)
            .catch(reject);
          return;
        }
        console.error('Error caching family members:', error);
        reject(error);
      };

      transaction.oncomplete = () => {
        console.log(`[OK] Cached ${members.length} family members`);
        resolve();
      };

      // Clear existing members and add new ones
      membersStore.clear();
      members.forEach(member => {
        // Convert reactive proxy to plain object for IndexedDB storage
        const plainMember = JSON.parse(JSON.stringify(member));
        membersStore.add(plainMember);
      });

      // Update cache timestamp
      metadataStore.put({
        key: 'familyMembers_cached_at',
        value: Date.now()
      });
    });
  }

  // Get cached family members
  async getCachedFamilyMembers() {
    return this._transaction('familyMembers', 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (event) => reject(event.target.error);
      });
    });
  }


  // ==================== QUICKLIST OPERATIONS ====================

  // Cache quicklist items with timestamp
  async cacheQuicklist(items) {
    // Estimate size and check quota before write
    const estimatedSize = JSON.stringify(items).length * 2;
    const { canWrite } = await this.checkStorageBeforeWrite(estimatedSize);
    
    if (!canWrite) {
      await this.evictOldestData(estimatedSize);
    }

    const db = await this._ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['quicklist', 'metadata'], 'readwrite');
      const quicklistStore = transaction.objectStore('quicklist');
      const metadataStore = transaction.objectStore('metadata');

      transaction.onerror = (event) => {
        const error = event.target.error;
        if (error && (error.name === 'QuotaExceededError' || error.code === 22)) {
          console.warn('[WARN] QuotaExceededError while caching quicklist');
          this.handleQuotaExceeded('cacheQuicklist', () => this.cacheQuicklist(items))
            .then(resolve)
            .catch(reject);
          return;
        }
        console.error('Error caching quicklist:', error);
        reject(error);
      };

      transaction.oncomplete = () => {
        console.log(`[OK] Cached ${items.length} quicklist items`);
        resolve();
      };

      // Clear existing items and add new ones
      quicklistStore.clear();
      items.forEach(item => {
        // Convert reactive proxy to plain object for IndexedDB storage
        const plainItem = JSON.parse(JSON.stringify(item));
        quicklistStore.add(plainItem);
      });

      // Update cache timestamp
      metadataStore.put({
        key: 'quicklist_cached_at',
        value: Date.now()
      });
    });
  }

  // Get cached quicklist items
  async getCachedQuicklist() {
    return this._transaction('quicklist', 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (event) => reject(event.target.error);
      });
    });
  }

  // ==================== METADATA OPERATIONS ====================

  // Get last sync time for a specific data type
  async getLastSyncTime(dataType) {
    return this._transaction('metadata', 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.get(`${dataType}_cached_at`);
        request.onsuccess = () => resolve(request.result?.value || null);
        request.onerror = (event) => reject(event.target.error);
      });
    });
  }

  // Set last sync time for a specific data type
  async setLastSyncTime(dataType, time = Date.now()) {
    return this._transaction('metadata', 'readwrite', (store) => {
      store.put({
        key: `${dataType}_cached_at`,
        value: time
      });
    });
  }

  // Get cache freshness (time since last cache)
  async getCacheFreshness(dataType) {
    const lastSync = await this.getLastSyncTime(dataType);
    if (!lastSync) return null;
    return Date.now() - lastSync;
  }

  // Check if cache is stale (older than maxAge in ms)
  async isCacheStale(dataType, maxAge = 5 * 60 * 1000) {
    const freshness = await this.getCacheFreshness(dataType);
    if (freshness === null) return true;
    return freshness > maxAge;
  }

  // ==================== UTILITY OPERATIONS ====================

  // Clear all IndexedDB data
  async clearAll() {
    const db = await this._ensureDb();
    
    return new Promise((resolve, reject) => {
      const storeNames = ['chores', 'familyMembers', 'quicklist', 'syncQueue', 'metadata'];
      const transaction = db.transaction(storeNames, 'readwrite');

      transaction.onerror = (event) => {
        console.error('Error clearing all data:', event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        console.log('[OK] All IndexedDB data cleared');
        resolve();
      };

      storeNames.forEach(storeName => {
        transaction.objectStore(storeName).clear();
      });
    });
  }

  // Clear all Cache API caches
  async clearCacheAPI() {
    try {
      if (!('caches' in window)) {
        console.log('[WARN] Cache API not available');
        return { cleared: false, reason: 'Cache API not available' };
      }

      const cacheNames = await caches.keys();
      console.log(`[CLEANUP] Clearing ${cacheNames.length} cache(s)...`);
      
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log(`  Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );

      console.log('[OK] All Cache API caches cleared');
      return { cleared: true, count: cacheNames.length };
    } catch (error) {
      console.error('Error clearing Cache API:', error);
      return { cleared: false, reason: error.message };
    }
  }

  // Clear ALL cached data (IndexedDB + Cache API)
  // This is the comprehensive method for the "Clear Offline Data" feature
  async clearAllCachedData() {
    console.log('[CLEANUP] Clearing all offline cached data...');
    
    const results = {
      indexedDB: { cleared: false },
      cacheAPI: { cleared: false },
      success: false
    };

    try {
      // Clear IndexedDB
      await this.clearAll();
      results.indexedDB = { cleared: true };
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
      results.indexedDB = { cleared: false, error: error.message };
    }

    try {
      // Clear Cache API
      const cacheResult = await this.clearCacheAPI();
      results.cacheAPI = cacheResult;
    } catch (error) {
      console.error('Failed to clear Cache API:', error);
      results.cacheAPI = { cleared: false, error: error.message };
    }

    // Consider success if at least IndexedDB was cleared
    results.success = results.indexedDB.cleared;
    
    if (results.success) {
      console.log('[OK] All offline data cleared successfully');
    } else {
      console.warn('[WARN] Some offline data could not be cleared');
    }

    return results;
  }

  // Get storage statistics
  async getStorageStats() {
    const quota = await this.getStorageQuota();
    const persisted = await this.isStoragePersisted();
    
    // Count items in each store
    const counts = {};
    const stores = ['chores', 'familyMembers', 'quicklist', 'syncQueue'];
    
    for (const storeName of stores) {
      try {
        const items = await this._transaction(storeName, 'readonly', (store) => {
          return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
          });
        });
        counts[storeName] = items;
      } catch (error) {
        counts[storeName] = 0;
      }
    }

    return {
      quota,
      persisted,
      itemCounts: counts,
      totalItems: Object.values(counts).reduce((a, b) => a + b, 0)
    };
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('IndexedDB connection closed');
    }
  }
}

// Export singleton instance
window.offlineStorage = new OfflineStorage();

// Initialization function
window.initializeOfflineStorage = async function() {
  try {
    await window.offlineStorage.init();
    console.log('[OK] Offline Storage Service initialized');
    
    // Request persistent storage permission
    const persistResult = await window.offlineStorage.requestPersistentStorage();
    if (persistResult.granted) {
      console.log('[OK] Persistent storage enabled');
    } else {
      console.log('[INFO] Persistent storage not granted:', persistResult.reason || 'Browser decision');
    }
    
    // Log storage quota info
    const quota = await window.offlineStorage.getStorageQuota();
    console.log(`[INFO] Storage: ${quota.usageFormatted} / ${quota.quotaFormatted} (${quota.percentUsed.toFixed(1)}%)`);
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Offline Storage:', error);
    return false;
  }
};
