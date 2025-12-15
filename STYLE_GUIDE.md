# Family Hub - Style Guide

## Overview
This style guide defines the unified design system for the Family Hub application. It uses CSS custom properties (variables) to ensure consistency across all components and pages.

**⚠️ IMPORTANT: This is documentation only. All theme colors are defined in `config.js` and applied via CSS custom properties in `styles.css`.**

## Color System Architecture

### Standardized Shade Generation (HSL-Based)

All color shades are generated using a standardized HSL-based algorithm that produces perceptually uniform results similar to Tailwind CSS. Each theme only needs to define 7 base colors, and the system automatically generates the full 50-900 shade scale.

#### Shade Scale Reference
| Shade | Purpose | Example Usage |
|-------|---------|---------------|
| 50 | Lightest | Subtle backgrounds, highlights |
| 100 | Very light | Hover backgrounds |
| 200 | Light | Borders, dividers |
| 300 | Light-medium | Disabled states |
| 400 | Medium-light | Placeholder text |
| **500** | **BASE COLOR** | Primary usage, buttons |
| 600 | Medium-dark | Hover states on buttons |
| 700 | Dark | Active states, emphasis |
| 800 | Very dark | Text on light backgrounds |
| 900 | Darkest | Headings, high contrast |

### Theme Definition Structure

Each theme defines only 7 base colors:
```javascript
{
  id: 'themeName',
  name: 'Display Name',
  description: 'Theme description',
  colors: {
    primary: '#4A90E2',      // Main brand color (500)
    secondary: '#7B68EE',    // Accent color (500)
    success: '#22C55E',      // Positive actions (500)
    warning: '#F59E0B',      // Caution states (500)
    error: '#EF4444',        // Destructive actions (500)
    textPrimary: '#2D3748',  // Main text color
    textSecondary: '#718096' // Secondary text color
  }
}
```

### Generated CSS Variables

From each base color, the system generates a full shade scale:

#### Primary Colors (Full Scale)
```css
--color-primary-50   /* Lightest */
--color-primary-100
--color-primary-200
--color-primary-300
--color-primary-400
--color-primary-500  /* Base color */
--color-primary-600
--color-primary-700
--color-primary-800
--color-primary-900  /* Darkest */
```

#### Secondary Colors (Full Scale)
```css
--color-secondary-50 through --color-secondary-900
```

#### Status Colors (Partial Scale)
```css
--color-success-50, 100, 200, 500, 600, 700
--color-warning-50, 100, 200, 500, 600, 700
--color-error-50, 100, 200, 500, 600, 700
```

### Semantic Color Mappings

Components use semantic aliases that automatically adapt to themes:

```css
/* Text colors */
--color-text-primary    /* Main body text */
--color-text-secondary  /* Supporting text */
--color-text-muted      /* De-emphasized text */

/* Background colors */
--color-bg-primary      /* Page background */
--color-bg-secondary    /* Section backgrounds */
--color-bg-card         /* Card surfaces */
--color-bg-card-hover   /* Card hover state */
--color-border-card     /* Card borders */

/* Component-specific */
--color-quicklist-bg, --color-quicklist-border
--color-family-card-bg, --color-family-card-border
--color-earnings-border, --color-earnings-text
```

### Theme Switching

```javascript
// Apply a theme
ThemeManager.applyTheme('forest');

// Save theme (persists to localStorage)
ThemeManager.saveTheme('sunset');

// Get current theme
const current = ThemeManager.getCurrentTheme();
```

### Dark Theme Detection

Dark themes are automatically detected by analyzing the `textPrimary` luminance. If the text color is light (luminance > 50%), the theme is treated as dark, which inverts the neutral scale and adjusts backgrounds accordingly.

## Button Components

### Primary Button
```html
<button class="btn-primary">Primary Action</button>
```
- Uses `var(--gradient-primary)` background
- Inherits from theme's primary colors

### Secondary Button
```html
<button class="btn-secondary">Secondary Action</button>
```
- White background with `var(--color-primary-500)` border
- Theme-aware color changes

### Status Buttons
```html
<button class="btn-success">Success Action</button>
<button class="btn-warning">Warning Action</button>
<button class="btn-error">Error/Delete Action</button>
```

## Card Components

### Basic Card
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-subtitle">Optional subtitle</p>
  </div>
  <p>Card content goes here</p>
</div>
```

Cards automatically inherit theme colors via:
- `background: var(--color-bg-card)`
- `border: 1px solid var(--color-border-card)`

## Typography

### Text Color Classes
- `.text-primary` - Uses `var(--color-primary-500)`
- `.text-secondary` - Uses `var(--color-neutral-600)`
- `.text-muted` - Uses `var(--color-neutral-500)`
- `.text-error` - Uses `var(--color-error-600)`
- `.text-success` - Uses `var(--color-success-600)`
- `.text-warning` - Uses `var(--color-warning-600)`

### Custom Text Colors (Theme-aware)
- `.text-primary-custom` - Uses `var(--color-text-primary)`
- `.text-secondary-custom` - Uses `var(--color-text-secondary)`

## Component-Specific Classes

### Family Cards
```html
<div class="family-card">
  <!-- Content -->
</div>
```
- Background: `var(--color-family-card-bg)`
- Border: `var(--color-family-card-border)`

### Quicklist Cards
```html
<div class="quicklist-card">
  <!-- Content -->
</div>
```
- Background: `var(--color-quicklist-bg)`
- Border: `var(--color-quicklist-border)`

## Avatar Component

### Basic Avatar
```html
<div class="avatar">U</div>
```
- Background: `var(--gradient-primary)`

### Large Avatar
```html
<div class="avatar avatar-lg">U</div>
```

## Design Tokens

### Spacing System
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

### Border Radius
```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
```

### Transitions
```css
--transition-fast: 150ms ease-in-out;
--transition-normal: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
```

## Usage Guidelines

### ✅ Do's
- Use CSS custom properties: `var(--color-primary-500)`
- Use semantic classes: `.btn-primary`, `.card`, `.family-card`
- Use design tokens: `var(--space-4)`, `var(--radius-lg)`
- Test all themes when adding new components
- Follow the component-specific class patterns

### ❌ Don'ts
- Don't use hardcoded colors like `#4A90E2` in templates
- Don't create custom button styles - extend existing classes
- Don't use arbitrary spacing or colors
- Don't ignore theme switching in new components

## Theme Development

### Adding a New Theme
1. Add theme definition to `CONFIG.THEMES` in `config.js`
2. Test all components with the new theme
3. Update component-specific colors if needed

### Adding Theme-Aware Components
1. Use CSS custom properties for all colors
2. Add component-specific color mappings to `:root` in `styles.css`
3. Create utility classes following the naming pattern
4. Test with multiple themes

## Migration Guide

### Updating Existing Components
1. Replace hardcoded hex colors with CSS custom properties
2. Replace inline styles with utility classes
3. Use semantic color classes (`.text-primary-custom` instead of direct color values)
4. Test theme switching functionality

### Before (Hardcoded)
```html
<div style="background: #4A90E2; color: white;">
  <button style="background: #22c55e;">Action</button>
</div>
```

### After (Theme-aware)
```html
<div class="card">
  <button class="btn-success">Action</button>
</div>
```

## File Structure

```
frontEnd/
├── config.js          # ← THEMES defined here
├── styles.css         # ← CSS custom properties
├── STYLE_GUIDE.md     # ← This documentation
└── components/        # ← Use theme-aware classes
```

This architecture ensures consistent theming across the entire application while maintaining a single source of truth for all color definitions. 