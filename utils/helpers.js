// shared UI helpers (no bundler, attach to window)
(function() {
  // Set window.Helpers immediately to avoid timing issues
  window.Helpers = window.Helpers || {};

  // Critical fallback icons (inline SVGs for offline/CDN failure)
  const fallbackIcons = {
    home: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3,9,9-7,9,7v11a2,2 0 0,1-2,2H5a2,2 0 0,1-2-2z"></path><polyline points="9,22,9,12,15,12,15,22"></polyline></svg>',
    menu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"></polyline></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    'alert-triangle': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    loader: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21,12a9,9 0 1,1-6.219-8.56"></path></svg>'
  };

  // Icon system for CDN-loaded icon libraries
  const IconLibrary = {
    // Store fallback icons
    fallbackIcons: fallbackIcons,

    /**
     * Check if Lucide library is available
     * @returns {boolean}
     */
    isLucideAvailable() {
      return typeof window.lucide !== 'undefined' && typeof window.lucide.icons !== 'undefined';
    },

    /**
     * Convert kebab-case to PascalCase (Lucide icon name format)
     * @param {string} name - kebab-case icon name
     * @returns {string} PascalCase name
     */
    toPascalCase(name) {
      return name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
    },

    /**
     * Convert camelCase to kebab-case
     * @param {string} name - camelCase icon name
     * @returns {string} kebab-case name
     */
    toKebabCase(name) {
      return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    },

    /**
     * Check if an icon exists in the library
     * @param {string} iconName - Icon name (kebab-case or camelCase)
     * @returns {boolean}
     */
    hasIcon(iconName) {
      if (!iconName || typeof iconName !== 'string') {
        return false;
      }

      // Check fallback icons first
      const kebabName = this.toKebabCase(iconName);
      if (fallbackIcons[kebabName]) {
        return true;
      }

      // Check Lucide library
      if (this.isLucideAvailable()) {
        const pascalName = this.toPascalCase(kebabName);
        return !!window.lucide.icons[pascalName];
      }

      return false;
    },

    /**
     * Get list of all available icon names
     * @returns {string[]} Array of icon names in kebab-case
     */
    getAvailableIcons() {
      const icons = new Set(Object.keys(fallbackIcons));

      if (this.isLucideAvailable()) {
        Object.keys(window.lucide.icons).forEach(pascalName => {
          // Convert PascalCase to kebab-case
          const kebabName = pascalName
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();
          icons.add(kebabName);
        });
      }

      return Array.from(icons).sort();
    },

    /**
     * Get an icon by name from the Lucide library
     * @param {string} iconName - Lucide icon name (kebab-case or camelCase)
     * @param {string} library - Icon library (only 'lucide' supported, kept for API compatibility)
     * @param {number} size - Icon size in pixels (default: 16)
     * @param {string} className - CSS classes to apply
     * @param {object} aria - Accessibility options
     * @param {string} aria.label - aria-label for meaningful icons
     * @param {boolean} aria.hidden - true for decorative icons
     * @returns {string} SVG markup or empty string
     */
    getIcon(iconName, library, size = 16, className = '', aria = {}) {
      // Validate library parameter (only Lucide is supported)
      if (library && library !== 'lucide') {
        console.warn(`[WARN] Unsupported icon library: ${library}. Only 'lucide' is supported.`);
      }
      // Handle case where getIcon is called before Helpers is fully initialized
      if (!window.Helpers || !window.Helpers.IconLibrary) {
        console.warn('[WARN] IconLibrary.getIcon called before Helpers is initialized');
        return '';
      }

      if (!iconName || typeof iconName !== 'string') {
        console.warn('[WARN] Invalid icon name provided');
        return '';
      }

      // Normalize icon name to kebab-case
      const kebabName = this.toKebabCase(iconName);
      const pascalName = this.toPascalCase(kebabName);

      let svg = '';

      // Try to get icon from Lucide library
      if (this.isLucideAvailable()) {
        const iconData = window.lucide.icons[pascalName];
        if (iconData) {
          // Lucide icons structure: array of [tagName, attrs] tuples
          // e.g., [["path", {d: "..."}], ["path", {d: "..."}]]
          // Build SVG from Lucide icon data
          svg = this.buildSvgFromLucide(null, iconData, size, className, aria);
        }
      }

      // Fall back to inline SVGs if Lucide not available or icon not found
      if (!svg && fallbackIcons[kebabName]) {
        svg = fallbackIcons[kebabName];
        svg = this.applySizeAndClass(svg, size, className, aria);
      }

      // Log warning if icon not found
      if (!svg) {
        console.warn(`[WARN] Icon "${iconName}" not found in Lucide library`);
        return '';
      }

      return svg;
    },

    /**
     * Build SVG string from Lucide icon data
     * @param {Array} attrs - SVG attributes from Lucide
     * @param {Array} children - SVG child elements from Lucide
     * @param {number} size - Icon size
     * @param {string} className - CSS classes
     * @param {object} aria - Accessibility options
     * @returns {string} SVG markup
     */
    buildSvgFromLucide(attrs, children, size, className, aria) {
      // Build attributes string
      let attrStr = `xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
      
      if (className) {
        attrStr += ` class="${className}"`;
      }

      // Add aria attributes
      if (aria && aria.label) {
        attrStr += ` aria-label="${aria.label}" role="img"`;
      }
      if (aria && aria.hidden === true) {
        attrStr += ` aria-hidden="true"`;
      }

      // Build children string
      let childrenStr = '';
      if (Array.isArray(children)) {
        children.forEach(child => {
          if (Array.isArray(child) && child.length >= 2) {
            const [tagName, tagAttrs] = child;
            let tagAttrStr = Object.entries(tagAttrs || {})
              .map(([key, value]) => `${key}="${value}"`)
              .join(' ');
            childrenStr += `<${tagName} ${tagAttrStr}></${tagName}>`;
          }
        });
      }

      return `<svg ${attrStr}>${childrenStr}</svg>`;
    },

    /**
     * Apply size, class, and aria attributes to an existing SVG string
     * @param {string} svg - Original SVG string
     * @param {number} size - Icon size
     * @param {string} className - CSS classes
     * @param {object} aria - Accessibility options
     * @returns {string} Modified SVG string
     */
    applySizeAndClass(svg, size, className, aria) {
      // Replace width and height
      svg = svg.replace(/width="[^"]*"/, `width="${size}"`);
      svg = svg.replace(/height="[^"]*"/, `height="${size}"`);
      
      // Handle class attribute
      if (className) {
        if (svg.includes('class="')) {
          svg = svg.replace(/class="[^"]*"/, `class="${className}"`);
        } else {
          svg = svg.replace('<svg ', `<svg class="${className}" `);
        }
      }

      // Add aria attributes
      if (aria && aria.label) {
        if (!svg.includes('aria-label')) {
          svg = svg.replace('<svg ', `<svg aria-label="${aria.label}" role="img" `);
        }
      }
      if (aria && aria.hidden === true) {
        if (!svg.includes('aria-hidden')) {
          svg = svg.replace('<svg ', `<svg aria-hidden="true" `);
        }
      }

      return svg;
    },

    // Initialize icon libraries when DOM is ready
    initializeLibraries() {
      // Lucide icons initialization (if loaded)
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      } else {
        console.warn('[WARN] Lucide library not loaded, using fallback icons');
      }
    },

    // Helper functions for UI functionality
    getCategoryIcon(category) {
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
    },

    getCategoryLabel(category) {
      switch (category) {
        case 'school': return 'School';
        case 'game': return 'Electronics';
        default: return 'Regular';
      }
    },

    isChoreSelected(selectedChoreId, selectedQuicklistChore, chore) {
      if (!chore) return false;
      if (selectedQuicklistChore && selectedQuicklistChore.name === chore.name) return true;
      return !!(selectedChoreId && chore.id === selectedChoreId);
    }
  };

  // Attach IconLibrary to window.Helpers immediately
  window.Helpers.IconLibrary = IconLibrary;
})();
