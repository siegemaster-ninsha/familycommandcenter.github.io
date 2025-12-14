# Shoelace Web Components Implementation Guide

## Overview

This document explains how Shoelace web components are implemented in our Vue.js application. The implementation is optimized for GitHub Pages deployment and provides a robust, fallback-free approach to using modern web components.

## Architecture

### 1. CDN Loading Strategy

**Primary Implementation:**
- Shoelace is loaded via ESM (ECMAScript Modules) from CDN
- Uses `esm.sh` as primary CDN with `skypack` as fallback
- Includes graceful degradation to older version if needed

**Key Benefits:**
- No build process required - loads directly in browser
- Works with GitHub Pages static hosting
- ESM loading happens client-side, avoiding server-side module resolution issues
- Automatic dependency resolution via CDN

```html
<!-- Shoelace CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.0/dist/themes/light.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0/dist/themes/light.css" />

<!-- ESM Loading Script -->
<script type="module">
  try {
    // Primary CDN with automatic dependency resolution
    await import('https://esm.sh/@shoelace-style/shoelace@2.15.0');
    console.log('✅ Shoelace loaded successfully via esm.sh');

    window.dispatchEvent(new CustomEvent('shoelace-ready', {
      detail: { version: '2.15.0', cdn: 'esm.sh' }
    }));
  } catch (error) {
    console.error('❌ Failed to load Shoelace via esm.sh:', error);

    // Fallback CDN
    try {
      await import('https://cdn.skypack.dev/@shoelace-style/shoelace@2.15.0');
      console.log('✅ Shoelace loaded via skypack CDN');
      window.dispatchEvent(new CustomEvent('shoelace-ready', {
        detail: { version: '2.15.0', cdn: 'skypack' }
      }));
    } catch (fallbackError) {
      // Last resort fallback to older version
      try {
        await import('https://esm.sh/@shoelace-style/shoelace@2.0.0');
        console.log('✅ Shoelace v2.0.0 loaded via esm.sh');
        window.dispatchEvent(new CustomEvent('shoelace-ready', {
          detail: { version: '2.0.0', cdn: 'esm.sh' }
        }));
      } catch (finalError) {
        console.error('❌ All Shoelace loading attempts failed:', finalError);
      }
    }
  }
</script>
```

### 2. Vue.js Integration

**Global Configuration:**
Vue is configured globally to recognize Shoelace custom elements, eliminating the need for component-level configuration conflicts.

```javascript
const app = createApp({
  compilerOptions: {
    // Treat Shoelace elements as custom elements
    isCustomElement: (tag) => {
      if (tag.startsWith('sl-')) {
        console.log(`🔧 Global Vue compiler: Treating ${tag} as custom element`);
        return true;
      }
      return false;
    }
  },
  // ... rest of app config
});
```

**Key Benefits:**
- Single configuration point for all Shoelace components
- No component-level `compilerOptions` needed (prevents conflicts)
- Consistent behavior across all Vue components

## Usage Patterns

### 1. Basic Component Usage

```vue
<template>
  <div>
    <!-- Simple switch -->
    <sl-switch
      :checked="isEnabled"
      @sl-change="handleToggle"
      size="small"
    >
      Enable Feature
    </sl-switch>

    <!-- Button with variant -->
    <sl-button
      variant="primary"
      size="medium"
      @click="handleAction"
    >
      Click Me
    </sl-button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isEnabled: false
    };
  },
  methods: {
    handleToggle(event) {
      this.isEnabled = event.target.checked;
    },
    handleAction() {
      // Handle button click
    }
  }
};
</script>
```

### 2. Event Handling

**Standard Web Component Events:**
- Use kebab-case event names: `@sl-change`, `@sl-input`, `@sl-click`
- Access values via `event.target.property`: `event.target.checked`, `event.target.value`

```javascript
methods: {
  handleSwitchChange(event) {
    // For sl-switch
    const isChecked = event.target.checked;
    this.updateSetting(isChecked);
  },

  handleInputChange(event) {
    // For sl-input
    const value = event.target.value;
    this.searchTerm = value;
  }
}
```

### 3. Property Binding

**Reactive Properties:**
- Use `:property` syntax for reactive binding
- Properties update automatically when Vue data changes

```vue
<sl-switch
  :checked="person.enabledForChores"
  @sl-change="handleChoreToggle(person, $event)"
  size="small"
>
  {{ person.enabledForChores ? 'Visible' : 'Hidden' }}
</sl-switch>
```

## Component Examples

### 1. Switch Component (sl-switch)

```vue
<template>
  <div class="flex flex-col sm:flex-row sm:items-center gap-3">
    <label class="text-sm font-medium min-w-[100px]">Show on chore board</label>
    <sl-switch
      :checked="person.enabledForChores"
      @sl-change="handleChoreToggle(person, $event)"
      size="small"
      class="family-card-switch"
    >
      {{ person.enabledForChores ? 'Visible' : 'Hidden' }}
    </sl-switch>
  </div>
</template>

<script>
export default {
  methods: {
    handleChoreToggle(person, event) {
      person.enabledForChores = event.target.checked;
      this.$parent.updateMemberChoresEnabled(person);
    }
  }
};
</script>
```

**Available Properties:**
- `checked` (Boolean) - Controls the switch state
- `disabled` (Boolean) - Disables the switch
- `size` (String) - Size: 'small', 'medium', 'large'
- `loading` (Boolean) - Shows loading state

### 2. Button Component (sl-button)

```vue
<sl-button
  variant="primary"
  size="medium"
  :disabled="isLoading"
  @click="handleClick"
>
  <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white')"></div>
  <span class="font-medium">Add Item</span>
</sl-button>
```

**Available Properties:**
- `variant` - 'default', 'primary', 'success', 'warning', 'danger'
- `size` - 'small', 'medium', 'large'
- `disabled` (Boolean)
- `loading` (Boolean)

## Styling Guidelines

### 1. CSS Variables Integration

Shoelace uses CSS custom properties that integrate well with our existing design system:

```css
/* Shoelace uses these variables */
--color-primary-500: #your-primary-color;
--color-bg-card: #your-card-background;
```

### 2. Component-Specific Classes

```css
.family-card-switch {
  /* Custom styling for switches in family cards */
}
```

### 3. Theme Integration

The light theme is loaded by default and integrates with our existing color variables:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.0/dist/themes/light.css" />
```

## Best Practices

### 1. No Runtime Detection

**Don't do this:**
```javascript
// ❌ Unnecessary complexity
data() {
  return {
    shoelaceLoaded: false,
    isShoelaceAvailable: false
  };
},
mounted() {
  this.checkShoelaceLoaded();
}
```

**Do this:**
```javascript
// ✅ Simple and reliable
methods: {
  // Just use the component directly
}
```

### 2. No Fallback Components

**Don't do this:**
```vue
<!-- ❌ Overcomplicated -->
<sl-switch v-if="isShoelaceAvailable">
  <!-- Shoelace switch -->
</sl-switch>
<div v-else>
  <!-- Fallback checkbox -->
</div>
```

**Do this:**
```vue
<!-- ✅ Clean and simple -->
<sl-switch @sl-change="handleChange">
  Label Text
</sl-switch>
```

### 3. Proper Event Handling

**Don't do this:**
```javascript
// ❌ Inline event handler
@sl-change="person.enabledForChores = !person.enabledForChores"
```

**Do this:**
```javascript
// ✅ Dedicated method for clarity and reusability
@sl-change="handleChoreToggle(person, $event)"
```

## Troubleshooting

### 1. Components Not Rendering

**Check:**
1. Global Vue `compilerOptions` is configured for `sl-` tags
2. Shoelace CSS is loaded in `<head>`
3. ESM script has executed (check console for "Shoelace loaded successfully")
4. No JavaScript errors preventing component registration

**Debug Command:**
```javascript
// Run in browser console
window.debugShoelace();
```

### 2. Events Not Firing

**Check:**
1. Using correct event names (`sl-change`, not `change`)
2. Event handler is properly bound
3. Component is actually a Shoelace component (check DOM)

### 3. Styling Issues

**Check:**
1. Shoelace CSS is loaded before component usage
2. CSS custom properties are defined
3. No CSS specificity conflicts

## Migration Guide

When upgrading Shoelace versions:

1. Update CDN URLs in `index.html`
2. Test all used components for breaking changes
3. Update component properties if APIs changed
4. Verify styling still works correctly

## Performance Considerations

1. **CDN Loading:** ESM loading happens asynchronously and doesn't block page rendering
2. **Bundle Size:** Only load CSS for used components (if using dynamic imports)
3. **Caching:** CDNs provide good caching for static assets
4. **No Build Step:** Zero build overhead for component library

## Browser Support

- Modern browsers with ESM support (Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+)
- Graceful degradation for older browsers via `nomodule` fallback
- GitHub Pages compatible

This implementation provides a clean, maintainable approach to using Shoelace web components in Vue.js applications without unnecessary complexity or fallbacks.
