// shared UI helpers (no bundler, attach to window)
(function() {
  function getCategoryIcon(category) {
    switch (category) {
      case 'school':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M208,24H72A32,32,0,0,0,40,56V224a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16H56a16,16,0,0,1,16-16H208a8,8,0,0,0,8-8V32A8,8,0,0,0,208,24ZM72,40H200V184H72a31.82,31.82,0,0,0-16,4.29V56A16,16,0,0,1,72,40Z"></path>
          </svg>`;
      case 'game':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M192,88h16a8,8,0,0,1,0,16H192a8,8,0,0,1,0-16ZM48,104H64a8,8,0,0,0,0-16H48a8,8,0,0,0,0,16ZM208,40H48A24,24,0,0,0,24,64V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V64A24,24,0,0,0,208,40ZM216,192a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8V192Z"></path>
          </svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A8,8,0,0,0,32,110.62V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V110.62A8,8,0,0,0,218.83,103.77ZM208,208H48V115.54L128,44.77,208,115.54V208ZM112,176V136a8,8,0,0,1,8-8h16a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V144H120v32a8,8,0,0,1-16,0Z"></path>
          </svg>`;
    }
  }

  function getCategoryLabel(category) {
    switch (category) {
      case 'school': return 'School';
      case 'game': return 'Electronics';
      default: return 'Regular';
    }
  }

  function isChoreSelected(selectedChoreId, selectedQuicklistChore, chore) {
    if (!chore) return false;
    if (selectedQuicklistChore && selectedQuicklistChore.name === chore.name) return true;
    return !!(selectedChoreId && chore.id === selectedChoreId);
  }

  // Icon system for CDN-loaded icon libraries
  const IconLibrary = {
    // Lucide Icons (recommended - clean, modern design)
    lucide: {
      // Action icons
      trash: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"></polyline><path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
      plus: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,

      // Status icons
      check: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"></polyline></svg>`,
      alertTriangle: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73,18,8.27-14-16.54,0L2,18l9.73,0L21.73,18z"></path><path d="M12,9v4"></path><path d="M12,17h.01"></path></svg>`,
      xCircle: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,

      // Section header icons
      zap: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon></svg>`,
      clipboardList: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16,4h2a2,2 0 0,1,2,2v14a2,2 0 0,1-2,2H6a2,2 0 0,1-2-2V6a2,2 0 0,1,2-2h2"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="11" x2="9" y2="17"></line><line x1="15" y1="11" x2="15" y2="17"></line></svg>`,
      users: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17,21v-2a4,4 0 0,0-4-4H5a4,4 0 0,0-4,4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23,21v-2a4,4 0 0,0-3-3.87"></path><path d="M16,3.13a4,4 0 0,1,0,7.75"></path></svg>`,
      dollarSign: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17,5H9.5a3.5,3.5 0 0,0,0,7h5a3.5,3.5 0 0,1,0,7H6"></path></svg>`,

      // User and navigation icons
      user: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20,21v-2a4,4 0 0,0-4-4H8a4,4 0 0,0-4,4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
      home: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3,9,9-7,9,7v11a2,2 0 0,1-2,2H5a2,2 0 0,1-2-2z"></path><polyline points="9,22,9,12,15,12,15,22"></polyline></svg>`,

      // Loading and state icons
      loader: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21,12a9,9 0 1,1-6.219-8.56"></path></svg>`
    },


    // Helper function to get icon by name and library
    getIcon(iconName, library = 'lucide', size = 16, className = '') {
      const libraryIcons = this[library];
      if (!libraryIcons || !libraryIcons[iconName]) {
        console.warn(`Icon "${iconName}" not found in library "${library}"`);
        return '';
      }

      const svg = libraryIcons[iconName]();
      // Replace width and height in the SVG
      return svg.replace(/width="[^"]*"/, `width="${size}"`).replace(/height="[^"]*"/, `height="${size}"`).replace(/class="[^"]*"/, `class="${className}"`);
    },

    // Initialize icon libraries when DOM is ready
    initializeLibraries() {
      // Lucide icons initialization (if loaded)
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  };

  // Initialize icon libraries when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => IconLibrary.initializeLibraries());
  } else {
    IconLibrary.initializeLibraries();
  }

  window.Helpers = {
    getCategoryIcon,
    getCategoryLabel,
    isChoreSelected,
    IconLibrary
  };
})();


