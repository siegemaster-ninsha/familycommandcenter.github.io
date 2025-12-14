# Family Hub - Style Guide

## Overview
This style guide defines the unified design system for the Family Hub application. It uses CSS custom properties (variables) to ensure consistency across all components and pages.

**⚠️ IMPORTANT: This is documentation only. All theme colors are defined in `config.js` and applied via CSS custom properties in `styles.css`.**

## Color System Architecture

### 1. Base Theme Variables (Default Theme)
These are the core colors defined in CSS custom properties:

#### Primary Colors
- **Primary 500** (`--color-primary-500`): `#4A90E2` - Main brand color
- **Primary 600** (`--color-primary-600`): `#3a7bc8` - Hover states  
- **Primary 100** (`--color-primary-100`): `#e0efff` - Light backgrounds
- **Primary 50** (`--color-primary-50`): `#f0f7ff` - Lightest backgrounds

#### Secondary Colors
- **Secondary 500** (`--color-secondary-500`): `#7B68EE` - Accent color
- **Secondary 600** (`--color-secondary-600`): `#6d5ce6` - Hover states

#### Neutral Colors
- **Neutral 50** (`--color-neutral-50`): `#F8FAFC` - Light background
- **Neutral 200** (`--color-neutral-200`): `#e2e8f0` - Border color
- **Neutral 600** (`--color-neutral-600`): `#475569` - Secondary text
- **Neutral 800** (`--color-neutral-800`): `#2D3748` - Primary text

#### Status Colors
- **Success 500** (`--color-success-500`): `#50C878` - Green for positive actions
- **Warning 500** (`--color-warning-500`): `#FF8C42` - Orange for caution
- **Error 500** (`--color-error-500`): `#ef4444` - Red for destructive actions

### 2. Semantic Color Mappings
Components inherit from base theme variables:

```css
/* Text colors */
--color-text-primary: var(--color-neutral-800);
--color-text-secondary: var(--color-neutral-600);

/* Background colors */
--color-bg-card: #ffffff;
--color-border-card: var(--color-neutral-200);

/* Component-specific colors */
--color-family-card-bg: var(--color-bg-card);
--color-quicklist-bg: var(--color-bg-card);
```

### 3. Theme Switching
Themes are defined in `config.js` and applied via `ThemeManager`:

```javascript
// Available themes
CONFIG.THEMES = {
  default: { /* Ocean Blue */ },
  forest: { /* Forest Green */ },
  sunset: { /* Sunset Orange */ },
  // ... more themes
};

// Apply a theme
ThemeManager.applyTheme('forest');
```

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