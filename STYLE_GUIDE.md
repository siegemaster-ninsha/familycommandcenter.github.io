# Family Hub - Style Guide

## Overview
This style guide defines the unified design system for the Family Hub application. It uses CSS custom properties (variables) to ensure consistency across all components and pages.

## Color System

### Primary Colors
- **Primary 500** (`--color-primary-500`): `#607afb` - Main brand color
- **Primary 600** (`--color-primary-600`): `#4f68d8` - Hover states
- **Primary 700** (`--color-primary-700`): `#4338ca` - Active states

### Neutral Colors
- **Neutral 50** (`--color-neutral-50`): `#f8f9fc` - Light background
- **Neutral 200** (`--color-neutral-200`): `#e6e9f4` - Border color
- **Neutral 600** (`--color-neutral-600`): `#47569e` - Secondary text
- **Neutral 900** (`--color-neutral-900`): `#0d0f1c` - Primary text

### Status Colors
- **Success**: `#22c55e` - Green for positive actions
- **Warning**: `#f59e0b` - Orange for caution
- **Error**: `#ef4444` - Red for destructive actions

## Button Components

### Primary Button
```html
<button class="btn-primary">Primary Action</button>
```
- Used for main call-to-action buttons
- Blue gradient background with hover effects

### Secondary Button
```html
<button class="btn-secondary">Secondary Action</button>
```
- Used for secondary actions
- White background with blue border

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

## Typography

### Text Colors
- `.text-primary` - Brand blue color
- `.text-secondary` - Muted gray for secondary text
- `.text-muted` - Light gray for less important text
- `.text-error` - Red for error messages
- `.text-success` - Green for success messages
- `.text-warning` - Orange for warning messages

## Avatar Component

### Basic Avatar
```html
<div class="avatar">U</div>
```

### Large Avatar
```html
<div class="avatar avatar-lg">U</div>
```

## Spacing System

Use CSS variables for consistent spacing:
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-6`: 24px
- `--space-8`: 32px

## Border Radius

- `--radius-sm`: 6px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-xl`: 16px

## Transitions

- `--transition-fast`: 150ms ease-in-out
- `--transition-normal`: 200ms ease-in-out
- `--transition-slow`: 300ms ease-in-out

## Loading States

Add the `.loading` class to any element to show a loading spinner:
```html
<button class="btn-primary loading">Loading...</button>
```

## Touch Targets

All interactive elements should use the `.touch-target` class for minimum 44px touch targets on mobile.

## Usage Guidelines

### Do's
- ✅ Use CSS variables for colors instead of hardcoded values
- ✅ Use the button classes for consistent styling
- ✅ Apply proper spacing using the spacing scale
- ✅ Ensure 44px minimum touch targets for mobile
- ✅ Use semantic color classes (success, warning, error)

### Don'ts
- ❌ Don't use hardcoded colors like `#607afb` in templates
- ❌ Don't create custom button styles - use the provided classes
- ❌ Don't use arbitrary spacing values
- ❌ Don't ignore hover/focus states

## Responsive Design

The design system is mobile-first with these breakpoints:
- **sm**: 640px and up
- **md**: 768px and up  
- **lg**: 1024px and up

## Accessibility

- All buttons include proper focus states
- Color combinations meet WCAG contrast requirements
- Touch targets are minimum 44px for mobile accessibility
- Use semantic HTML elements where possible

## Migration Guide

To update existing components:

1. Replace hardcoded colors with CSS variable classes
2. Replace custom button styles with `.btn-*` classes
3. Replace custom cards with `.card` class
4. Use `.text-*` classes for typography colors
5. Apply `.touch-target` to interactive elements

## Examples

### Before (Old Style)
```html
<button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click Me
</button>
```

### After (New Style)
```html
<button class="btn-primary">
  Click Me
</button>
```

This ensures consistency, maintainability, and easier theming across the entire application. 