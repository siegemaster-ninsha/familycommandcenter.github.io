/**
 * WebSocket Composable
 * Manages real-time WebSocket connection for live updates across devices.
 * Handles connection, reconnection with exponential backoff, and message routing.
 * 
 * All state updates go through Pinia stores - no app.js callbacks needed.
 */

const useWebSocket = () => {
  // Connection state
  let socket = null;
  let socketConnected = false;
  let socketRetryMs = 1000;

  /**
   * Get the WebSocket URL with authentication token
   * @returns {string|null} WebSocket URL or null if no token
   */
  const getWebSocketUrl = () => {
    const token = window.authService?.idToken || window.authService?.accessToken;
    if (!token) return null;
    
    const wsBase = (CONFIG.API.WS_BASE || CONFIG.API.BASE_URL).replace('https://', 'wss://');
    const stage = CONFIG.API.STAGE || 'dev';
    return wsBase.replace(/\/$/, '') + `/${stage}?token=${encodeURIComponent(token)}`;
  };

  /**
   * Initialize WebSocket connection
   */
  const connect = () => {
    try {
      // Close existing connection if any
      if (socket) {
        try { socket.close(); } catch { /* ignore close errors */ }
        socket = null;
      }

      const url = getWebSocketUrl();
      if (!url) {
        if (CONFIG?.ENV?.IS_DEVELOPMENT) {
          console.log('[WS] No auth token available, skipping connection');
        }
        return;
      }

      if (CONFIG?.ENV?.IS_DEVELOPMENT) {
        console.log('[WS] Connecting to:', url.split('?')[0]);
      }

      const ws = new WebSocket(url);
      socket = ws;

      ws.onopen = () => {
        socketConnected = true;
        socketRetryMs = 1000; // Reset retry delay on successful connection
        if (CONFIG?.ENV?.IS_DEVELOPMENT) {
          console.log('[WS] Connected');
        }
      };

      ws.onclose = () => {
        socketConnected = false;
        const delay = Math.min(socketRetryMs, 30000);
        if (CONFIG?.ENV?.IS_DEVELOPMENT) {
          console.log(`[WS] Disconnected, reconnecting in ${delay}ms`);
        }
        setTimeout(() => connect(), delay);
        socketRetryMs *= 2; // Exponential backoff
      };

      ws.onerror = () => {
        try { ws.close(); } catch { /* ignore */ }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleMessage(msg);
        } catch {
          /* ignore parse errors */
        }
      };
    } catch (e) {
      console.warn('[WS] Init failed:', e);
    }
  };

  /**
   * Disconnect WebSocket
   */
  const disconnect = () => {
    if (socket) {
      try { socket.close(); } catch { /* ignore */ }
      socket = null;
      socketConnected = false;
    }
  };

  /**
   * Check if WebSocket is connected
   * @returns {boolean}
   */
  const isConnected = () => socketConnected;

  /**
   * Handle incoming WebSocket message
   * Routes to appropriate store or callback based on message type
   * @param {Object} msg - Parsed message object with type and data
   */
  const handleMessage = (msg) => {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      // ==================
      // CHORE EVENTS
      // ==================
      case 'chore.created':
        handleChoreCreated(msg.data);
        break;

      case 'chore.updated':
        handleChoreUpdated(msg.data);
        break;

      case 'chore.deleted':
        handleChoreDeleted(msg.data);
        break;

      // ==================
      // QUICKLIST EVENTS
      // ==================
      case 'quicklist.created':
        handleQuicklistCreated(msg.data);
        break;

      case 'quicklist.updated':
      case 'quicklist.scheduleUpdated':
        handleQuicklistUpdated(msg.data);
        break;

      case 'quicklist.deleted':
        handleQuicklistDeleted(msg.data);
        break;

      // ==================
      // CATEGORY EVENTS
      // ==================
      case 'category.created':
        handleCategoryCreated(msg.data);
        break;

      case 'category.updated':
        handleCategoryUpdated(msg.data);
        break;

      case 'category.deleted':
        handleCategoryDeleted(msg.data);
        break;

      // ==================
      // NEW DAY EVENT
      // ==================
      case 'newDay.completed':
        handleNewDayCompleted();
        break;

      // ==================
      // MEMBER EVENTS
      // ==================
      case 'member.sortOrderUpdated':
        handleMemberSortOrderUpdated(msg.data);
        break;

      case 'member.priorityChoreChanged':
        handleMemberPriorityChoreChanged(msg.data);
        break;

      case 'member.defaultOrderUpdated':
        handleMemberDefaultOrderUpdated(msg.data);
        break;

      default:
        if (CONFIG?.ENV?.IS_DEVELOPMENT) {
          console.log('[WS] Unknown message type:', msg.type);
        }
    }
  };

  // ==================
  // CHORE HANDLERS
  // ==================
  
  const handleChoreCreated = (data) => {
    const created = data?.chore;
    if (!created) return;

    const choresStore = window.useChoresStore?.();
    if (choresStore) {
      // Check for optimistic temp chore that matches
      const tempIdx = choresStore.chores.findIndex(c => 
        c?.isOptimistic && 
        c.name === created.name && 
        c.assignedTo === created.assignedTo && 
        c.amount === created.amount && 
        c.category === created.category
      );
      if (tempIdx >= 0) {
        choresStore.chores[tempIdx] = created;
      } else if (!choresStore.chores.some(c => c.id === created.id)) {
        choresStore.chores.push(created);
      }
    }
  };

  const handleChoreUpdated = (data) => {
    const updated = data?.chore;
    if (!updated) return;

    const choresStore = window.useChoresStore?.();
    if (choresStore) {
      const idx = choresStore.chores.findIndex(c => c.id === updated.id);
      if (idx >= 0) {
        choresStore.chores[idx] = updated;
      } else {
        choresStore.chores.push(updated);
      }
    }
  };

  const handleChoreDeleted = (data) => {
    const deletedId = data?.id;
    if (!deletedId) return;

    const choresStore = window.useChoresStore?.();
    if (choresStore) {
      choresStore.chores = choresStore.chores.filter(c => c.id !== deletedId);
    }
  };

  // ==================
  // QUICKLIST HANDLERS
  // ==================
  
  const handleQuicklistCreated = (data) => {
    const created = data?.quicklistChore;
    if (!created) return;

    const choresStore = window.useChoresStore?.();
    if (choresStore && !choresStore.quicklistChores.some(q => q.id === created.id)) {
      choresStore.quicklistChores.push(created);
    }
  };

  const handleQuicklistUpdated = (data) => {
    const updated = data?.quicklistChore;
    if (!updated) return;

    const choresStore = window.useChoresStore?.();
    if (choresStore) {
      const idx = choresStore.quicklistChores.findIndex(q => q.id === updated.id);
      if (idx >= 0) {
        choresStore.quicklistChores[idx] = updated;
      }
    }
  };

  const handleQuicklistDeleted = (data) => {
    const deletedId = data?.id;
    if (!deletedId) return;

    const choresStore = window.useChoresStore?.();
    if (choresStore) {
      choresStore.quicklistChores = choresStore.quicklistChores.filter(q => q.id !== deletedId);
    }
  };

  // ==================
  // CATEGORY HANDLERS
  // ==================
  
  const handleCategoryCreated = (data) => {
    const created = data?.category;
    if (!created) return;

    const categoriesStore = window.useCategoriesStore?.();
    if (categoriesStore && !categoriesStore.categories.some(c => c.id === created.id)) {
      categoriesStore.categories.push(created);
    }
  };

  const handleCategoryUpdated = (data) => {
    const updated = data?.category;
    if (!updated) return;

    const categoriesStore = window.useCategoriesStore?.();
    if (categoriesStore) {
      const idx = categoriesStore.categories.findIndex(c => c.id === updated.id);
      if (idx >= 0) {
        categoriesStore.categories[idx] = updated;
      }
    }

    // Reload quicklist to update categoryName on items
    const choresStore = window.useChoresStore?.();
    if (choresStore) {
      choresStore.loadQuicklistChores();
    }
  };

  const handleCategoryDeleted = (data) => {
    const deletedId = data?.categoryId;
    if (!deletedId) return;

    const categoriesStore = window.useCategoriesStore?.();
    if (categoriesStore) {
      categoriesStore.categories = categoriesStore.categories.filter(c => c.id !== deletedId);
    }

    // Reload quicklist since items may have moved to Uncategorized
    const choresStore = window.useChoresStore?.();
    if (choresStore) {
      choresStore.loadQuicklistChores();
    }
  };

  // ==================
  // NEW DAY HANDLER
  // ==================
  
  const handleNewDayCompleted = () => {
    console.log('[WS] New day completed, reloading data...');

    // Reload chores
    const choresStore = window.useChoresStore?.();
    if (choresStore) {
      choresStore.loadChores();
    }

    // Reload family members (earnings may have changed)
    const familyStore = window.useFamilyStore?.();
    if (familyStore) {
      familyStore.loadMembers();
    }

    // Show notification
    const uiStore = window.useUIStore?.();
    if (uiStore) {
      uiStore.showSuccess('🌅 New day started on another device');
    }
  };

  // ==================
  // MEMBER HANDLERS
  // ==================
  
  const handleMemberSortOrderUpdated = (data) => {
    const { memberId, choreSortOrder } = data || {};
    if (!memberId) return;

    console.log('[WS] Sort order updated for member:', memberId);

    // Update the family store only - single source of truth
    const familyStore = window.useFamilyStore?.();
    if (familyStore) {
      const memberIndex = familyStore.members.findIndex(m => m.id === memberId);
      if (memberIndex >= 0) {
        familyStore.members[memberIndex] = {
          ...familyStore.members[memberIndex],
          choreSortOrder: choreSortOrder && typeof choreSortOrder === 'object' ? choreSortOrder : {}
        };
      }
    }
  };

  const handleMemberPriorityChoreChanged = (data) => {
    const { memberId, priorityChoreId } = data || {};
    if (!memberId) return;

    console.log('[WS] Priority chore changed for member:', memberId, '-> chore:', priorityChoreId);
    // The priority chore is computed from choreSortOrder and chores,
    // so we just need to ensure the data is up to date.
    // The priorityChoreByMember getter will automatically recompute.
  };

  const handleMemberDefaultOrderUpdated = (data) => {
    const { memberId, defaultChoreOrder } = data || {};
    if (!memberId) return;

    console.log('[WS] Default order updated for member:', memberId);

    // Update the family store only - single source of truth
    const familyStore = window.useFamilyStore?.();
    if (familyStore) {
      const memberIndex = familyStore.members.findIndex(m => m.id === memberId);
      if (memberIndex >= 0) {
        familyStore.members[memberIndex] = {
          ...familyStore.members[memberIndex],
          defaultChoreOrder: defaultChoreOrder && typeof defaultChoreOrder === 'object' ? defaultChoreOrder : {}
        };
      }
    }
  };

  // Return public API
  return {
    connect,
    disconnect,
    isConnected
  };
};

// Make available globally
window.useWebSocket = useWebSocket;
