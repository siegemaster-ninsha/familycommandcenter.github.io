// Sync Queue Service - Manages offline change queue for later synchronization
// Stores changes in IndexedDB syncQueue store and processes them when online

class SyncQueue {
  constructor() {
    this.dbName = 'FamilyCommandCenter';
    this.dbVersion = 1;
    this.storeName = 'syncQueue';
    this.db = null;
    this.maxRetries = 5;
    this.retryDelayMs = 1000; // Base delay for exponential backoff
  }

  // Initialize IndexedDB connection (reuses existing database)
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('SyncQueue: Failed to open IndexedDB');
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('✅ SyncQueue initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Create syncQueue store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  // Ensure database is ready
  async _ensureDb() {
    if (!this.db) await this.init();
    return this.db;
  }


  /**
   * Queue a change for later synchronization
   * @param {Object} change - The change to queue
   * @param {string} change.type - 'CREATE' | 'UPDATE' | 'DELETE'
   * @param {string} change.entity - 'chore' | 'familyMember' | 'quicklist'
   * @param {string} change.entityId - ID of the entity being modified
   * @param {Object} change.data - The change payload
   * @param {number} [change.serverTimestamp] - Server timestamp for conflict detection
   * @returns {Promise<number>} - The ID of the queued change
   */
  async enqueue(change) {
    const db = await this._ensureDb();

    const entry = {
      type: change.type,
      entity: change.entity,
      entityId: change.entityId,
      data: change.data,
      timestamp: Date.now(),
      serverTimestamp: change.serverTimestamp || null,
      status: 'pending',
      retryCount: 0,
      error: null
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.add(entry);

      request.onsuccess = () => {
        console.log(`📝 Queued ${change.type} for ${change.entity}:${change.entityId}`);
        resolve(request.result); // Returns the auto-generated ID
      };

      request.onerror = () => {
        console.error('Failed to enqueue change:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending changes from the queue
   * @returns {Promise<Array>} - Array of pending changes sorted by timestamp
   */
  async getPending() {
    const db = await this._ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');

      const request = index.getAll();

      request.onsuccess = () => {
        // Filter to only pending items and sort by timestamp
        const pending = (request.result || [])
          .filter(item => item.status === 'pending' || item.status === 'failed')
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(pending);
      };

      request.onerror = () => {
        console.error('Failed to get pending changes:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove successfully synced changes from the queue
   * @param {Array<number>} ids - Array of change IDs to remove
   * @returns {Promise<void>}
   */
  async dequeue(ids) {
    if (!ids || ids.length === 0) return;

    const db = await this._ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      transaction.oncomplete = () => {
        console.log(`✅ Dequeued ${ids.length} synced changes`);
        resolve();
      };

      transaction.onerror = () => {
        console.error('Failed to dequeue changes:', transaction.error);
        reject(transaction.error);
      };

      ids.forEach(id => store.delete(id));
    });
  }

  /**
   * Get count of pending changes
   * @returns {Promise<number>}
   */
  async getPendingCount() {
    const db = await this._ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const count = (request.result || [])
          .filter(item => item.status === 'pending' || item.status === 'failed')
          .length;
        resolve(count);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update the status of a queued change
   * @param {number} id - The change ID
   * @param {string} status - New status ('pending' | 'syncing' | 'failed')
   * @param {string} [error] - Error message if failed
   * @returns {Promise<void>}
   */
  async updateStatus(id, status, error = null) {
    const db = await this._ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (!entry) {
          resolve(); // Entry doesn't exist, nothing to update
          return;
        }

        entry.status = status;
        if (error) {
          entry.error = error;
          entry.retryCount = (entry.retryCount || 0) + 1;
        }

        const putRequest = store.put(entry);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Process all pending changes in the queue
   * Processes changes in timestamp order with retry logic
   * @param {Object} [options] - Processing options
   * @param {Function} [options.onProgress] - Callback for progress updates
   * @returns {Promise<{success: number, failed: number, conflicts: Array}>}
   */
  async processQueue(options = {}) {
    const { onProgress } = options;
    
    // Check if we're online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('⚠️ Cannot process queue while offline');
      return { success: 0, failed: 0, conflicts: [] };
    }

    // Get pending changes sorted by timestamp
    const pending = await this.getPending();
    
    if (pending.length === 0) {
      console.log('✅ No pending changes to sync');
      return { success: 0, failed: 0, conflicts: [] };
    }

    console.log(`🔄 Processing ${pending.length} pending changes...`);

    const results = { success: 0, failed: 0, conflicts: [] };
    const successIds = [];

    // Update offline store if available
    if (typeof window !== 'undefined' && window.useOfflineStore) {
      const offlineStore = window.useOfflineStore();
      offlineStore.setSyncInProgress(true);
    }

    try {
      for (let i = 0; i < pending.length; i++) {
        const change = pending[i];
        
        // Skip if max retries exceeded
        if (change.retryCount >= this.maxRetries) {
          console.log(`⚠️ Skipping change ${change.id} - max retries exceeded`);
          results.failed++;
          continue;
        }

        // Update status to syncing
        await this.updateStatus(change.id, 'syncing');

        try {
          // Process the change
          const result = await this._processChange(change);
          
          if (result.conflict) {
            results.conflicts.push({
              change,
              serverData: result.serverData,
              resolution: result.resolution
            });
            console.log(`⚠️ Conflict detected for ${change.entity}:${change.entityId}`);
          }

          successIds.push(change.id);
          results.success++;
          
          // Report progress
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: pending.length,
              change,
              success: true
            });
          }
        } catch (error) {
          console.error(`❌ Failed to sync change ${change.id}:`, error.message);
          
          // Update status to failed with error
          await this.updateStatus(change.id, 'failed', error.message);
          results.failed++;

          // Report progress
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: pending.length,
              change,
              success: false,
              error: error.message
            });
          }

          // Apply exponential backoff delay before next retry
          const delay = this.retryDelayMs * Math.pow(2, change.retryCount);
          await this._delay(Math.min(delay, 30000)); // Cap at 30 seconds
        }
      }

      // Remove successfully synced changes
      if (successIds.length > 0) {
        await this.dequeue(successIds);
      }

      // Update pending count in offline store
      if (typeof window !== 'undefined' && window.useOfflineStore) {
        const offlineStore = window.useOfflineStore();
        const newCount = await this.getPendingCount();
        offlineStore.setPendingSyncCount(newCount);
        offlineStore.updateLastSyncTime();
        offlineStore.setSyncInProgress(false);
      }

      console.log(`✅ Sync complete: ${results.success} success, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('❌ Queue processing error:', error);
      
      if (typeof window !== 'undefined' && window.useOfflineStore) {
        const offlineStore = window.useOfflineStore();
        offlineStore.setSyncInProgress(false);
        offlineStore.setSyncError(error.message);
      }
      
      throw error;
    }
  }

  /**
   * Process a single change by calling the appropriate API
   * @param {Object} change - The change to process
   * @returns {Promise<{conflict: boolean, serverData?: Object, resolution?: string}>}
   */
  async _processChange(change) {
    const { type, entity, entityId, data, serverTimestamp } = change;
    
    // Get API service
    const api = typeof window !== 'undefined' ? window.apiService : null;
    if (!api) {
      throw new Error('API service not available');
    }

    let endpoint;
    let payload = data;

    // Determine endpoint and method based on entity and type
    switch (entity) {
      case 'chore':
        endpoint = type === 'DELETE' ? `/chores/${entityId}` : '/chores';
        break;
      case 'familyMember':
        endpoint = type === 'DELETE' ? `/family/${entityId}` : '/family';
        break;
      case 'quicklist':
        endpoint = type === 'DELETE' ? `/quicklist/${entityId}` : '/quicklist';
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }

    // Check for conflicts before applying change (for UPDATE operations)
    let conflict = false;
    let serverData = null;
    let resolution = null;

    if (type === 'UPDATE' && serverTimestamp) {
      try {
        // Fetch current server state
        const currentData = await api.get(`${endpoint}/${entityId}`, { skipOfflineQueue: true });
        
        // Check for conflicts using timestamp comparison
        const conflictResult = this.detectConflict(change, currentData);
        
        if (conflictResult.isConflict) {
          conflict = true;
          serverData = currentData;
          resolution = 'last-write-wins';
          
          // Log conflict for debugging
          this.logConflict({ change, serverData: currentData, resolution });
        }
      } catch (error) {
        // If we can't fetch, proceed with the update
        console.log(`⚠️ Could not check for conflicts: ${error.message}`);
      }
    }

    // Execute the API call
    switch (type) {
      case 'CREATE':
        await api.post(endpoint, payload);
        break;
      case 'UPDATE':
        await api.put(`${endpoint}/${entityId}`, payload);
        break;
      case 'DELETE':
        await api.delete(endpoint);
        break;
      default:
        throw new Error(`Unknown change type: ${type}`);
    }

    return { conflict, serverData, resolution };
  }

  /**
   * Helper to delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log conflict details for debugging
   * @param {Object} conflict - Conflict information
   * @param {Object} conflict.change - The local change
   * @param {Object} conflict.serverData - The server data
   * @param {string} conflict.resolution - How the conflict was resolved
   */
  logConflict(conflict) {
    const { change, serverData, resolution } = conflict;
    console.group(`🔀 Sync Conflict - ${change.entity}:${change.entityId}`);
    console.log('Local change:', {
      type: change.type,
      timestamp: new Date(change.timestamp).toISOString(),
      data: change.data
    });
    console.log('Server data:', {
      updatedAt: serverData?.updatedAt ? new Date(serverData.updatedAt).toISOString() : 'N/A',
      data: serverData
    });
    console.log('Resolution:', resolution);
    console.groupEnd();
  }

  /**
   * Detect if there's a conflict between local and server data
   * Uses timestamp comparison for last-write-wins strategy
   * @param {Object} localChange - The local change
   * @param {Object} serverData - Current server data
   * @returns {{isConflict: boolean, winner: 'local'|'server'}}
   */
  detectConflict(localChange, serverData) {
    // No conflict if no server timestamp to compare
    if (!localChange.serverTimestamp || !serverData?.updatedAt) {
      return { isConflict: false, winner: 'local' };
    }

    // Compare timestamps - server data is newer if its updatedAt > local's serverTimestamp
    const isConflict = serverData.updatedAt > localChange.serverTimestamp;
    
    // Last-write-wins: local change always wins since it's the most recent user action
    // The conflict is logged but local change is still applied
    return { 
      isConflict, 
      winner: 'local' // Always apply local change (last-write-wins)
    };
  }

  /**
   * Clear all entries from the sync queue
   * @returns {Promise<void>}
   */
  async clear() {
    const db = await this._ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.clear();

      request.onsuccess = () => {
        console.log('✅ Sync queue cleared');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
window.syncQueue = new SyncQueue();

// Initialization function
window.initializeSyncQueue = async function() {
  try {
    await window.syncQueue.init();
    
    // Listen for sync trigger events from offline store
    window.addEventListener('process-sync-queue', async () => {
      try {
        await window.syncQueue.processQueue();
      } catch (error) {
        console.error('Error processing sync queue:', error);
      }
    });
    
    // Update pending count in offline store on init
    if (window.useOfflineStore) {
      const count = await window.syncQueue.getPendingCount();
      const offlineStore = window.useOfflineStore();
      offlineStore.setPendingSyncCount(count);
    }
    
    console.log('✅ Sync Queue Service initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Sync Queue:', error);
    return false;
  }
};
