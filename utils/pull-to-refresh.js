/**
 * Pull-to-Refresh Utility
 * Triggers a hard page refresh when user pulls down from the top of the page.
 * Works on both mobile (touch) and desktop (mouse drag).
 */

(function() {
  'use strict';

  const PULL_THRESHOLD = 150; // pixels to pull before triggering refresh
  const RESISTANCE = 2.5; // higher = more resistance when pulling
  const INDICATOR_MAX_HEIGHT = 80; // max height of the pull indicator

  let startY = 0;
  let currentY = 0;
  let isPulling = false;
  let indicator = null;
  let indicatorText = null;

  function createIndicator() {
    if (indicator) return;

    indicator = document.createElement('div');
    indicator.id = 'pull-to-refresh-indicator';
    indicator.innerHTML = `
      <div class="ptr-content">
        <svg class="ptr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span class="ptr-text">Pull to refresh</span>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #pull-to-refresh-indicator {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 0;
        background: linear-gradient(135deg, var(--color-primary, #6366f1) 0%, var(--color-primary-dark, #4f46e5) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        z-index: 10000;
        transition: none;
      }
      
      #pull-to-refresh-indicator.releasing {
        transition: height 0.3s ease-out;
      }
      
      #pull-to-refresh-indicator.refreshing {
        height: 60px !important;
        transition: height 0.2s ease-out;
      }
      
      .ptr-content {
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 0.2s, transform 0.2s;
      }
      
      #pull-to-refresh-indicator.visible .ptr-content {
        opacity: 1;
        transform: translateY(0);
      }
      
      .ptr-icon {
        width: 20px;
        height: 20px;
        transition: transform 0.3s ease;
      }
      
      #pull-to-refresh-indicator.ready .ptr-icon {
        transform: rotate(180deg);
      }
      
      #pull-to-refresh-indicator.refreshing .ptr-icon {
        animation: ptr-spin 1s linear infinite;
      }
      
      @keyframes ptr-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .ptr-text {
        white-space: nowrap;
      }
      
      /* Prevent body scroll during pull */
      body.ptr-pulling {
        overflow: hidden;
        touch-action: none;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(indicator);
    
    indicatorText = indicator.querySelector('.ptr-text');
  }

  function isAtTop() {
    return window.scrollY <= 0;
  }

  function canPull() {
    // Don't pull if a modal is open
    if (document.body.classList.contains('modal-open')) return false;
    // Don't pull if inside a scrollable container that isn't at top
    return isAtTop();
  }

  function updateIndicator(pullDistance) {
    if (!indicator) return;
    
    const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
    const height = Math.min(pullDistance / RESISTANCE, INDICATOR_MAX_HEIGHT);
    
    indicator.style.height = `${height}px`;
    
    if (height > 20) {
      indicator.classList.add('visible');
    } else {
      indicator.classList.remove('visible');
    }
    
    if (progress >= 1) {
      indicator.classList.add('ready');
      indicatorText.textContent = 'Release to refresh';
    } else {
      indicator.classList.remove('ready');
      indicatorText.textContent = 'Pull to refresh';
    }
  }

  function triggerRefresh() {
    indicator.classList.remove('ready');
    indicator.classList.add('refreshing');
    indicatorText.textContent = 'Refreshing...';
    
    // Hard refresh after a brief delay for visual feedback
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  }

  function resetIndicator() {
    if (!indicator) return;
    
    indicator.classList.add('releasing');
    indicator.classList.remove('visible', 'ready');
    indicator.style.height = '0';
    
    setTimeout(() => {
      indicator.classList.remove('releasing');
    }, 300);
    
    document.body.classList.remove('ptr-pulling');
  }

  // Touch events (mobile)
  function handleTouchStart(e) {
    if (!canPull()) return;
    
    startY = e.touches[0].clientY;
    isPulling = false;
    createIndicator();
  }

  function handleTouchMove(e) {
    if (!isAtTop()) {
      if (isPulling) {
        resetIndicator();
        isPulling = false;
      }
      return;
    }
    
    currentY = e.touches[0].clientY;
    const pullDistance = currentY - startY;
    
    if (pullDistance > 0) {
      isPulling = true;
      document.body.classList.add('ptr-pulling');
      e.preventDefault();
      updateIndicator(pullDistance);
    }
  }

  function handleTouchEnd() {
    if (!isPulling) return;
    
    const pullDistance = currentY - startY;
    
    if (pullDistance >= PULL_THRESHOLD) {
      triggerRefresh();
    } else {
      resetIndicator();
    }
    
    isPulling = false;
    startY = 0;
    currentY = 0;
  }

  // Mouse events (desktop)
  let isMouseDown = false;

  function handleMouseDown(e) {
    if (!canPull()) return;
    if (e.button !== 0) return; // Only left click
    
    startY = e.clientY;
    isMouseDown = true;
    isPulling = false;
    createIndicator();
  }

  function handleMouseMove(e) {
    if (!isMouseDown) return;
    if (!isAtTop()) {
      if (isPulling) {
        resetIndicator();
        isPulling = false;
      }
      return;
    }
    
    currentY = e.clientY;
    const pullDistance = currentY - startY;
    
    if (pullDistance > 10) { // Small threshold to distinguish from clicks
      isPulling = true;
      document.body.classList.add('ptr-pulling');
      e.preventDefault();
      updateIndicator(pullDistance);
    }
  }

  function handleMouseUp() {
    if (!isMouseDown) return;
    isMouseDown = false;
    
    if (!isPulling) return;
    
    const pullDistance = currentY - startY;
    
    if (pullDistance >= PULL_THRESHOLD) {
      triggerRefresh();
    } else {
      resetIndicator();
    }
    
    isPulling = false;
    startY = 0;
    currentY = 0;
  }

  // Initialize
  function init() {
    // Touch events
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Mouse events
    document.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseUp, { passive: true });
    
    if (CONFIG?.ENV?.IS_DEVELOPMENT) {
      console.log('✅ Pull-to-refresh initialized');
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual control if needed
  window.PullToRefresh = {
    init,
    triggerRefresh
  };
})();
