# Style Linter Violations Report

Generated: December 15, 2025

## Summary

The style linter has been successfully integrated and is detecting design system violations in the existing frontend codebase.

### Stylelint Violations (571 total)

| Category | Count | Description |
|----------|-------|-------------|
| Hardcoded Colors | ~150+ | Hex colors (#xxx), rgba(), rgb() values instead of var(--color-*) |
| Arbitrary Spacing | ~50+ | Pixel values for margin/padding/gap instead of var(--space-*) |
| Arbitrary Border-Radius | ~25+ | Pixel/rem values instead of var(--radius-*) |
| !important Usage | ~40+ | Declarations using !important |
| Vendor Prefixes | ~15+ | -webkit-, -moz-, -ms- prefixed properties |
| Selector Patterns | ~100+ | Tailwind-style selectors (hover\:, group-hover\:) flagged by kebab-case rule |
| Other | ~100+ | Media query notation, duplicate selectors, empty lines, etc. |

### ESLint Violations

| Category | Count | Description |
|----------|-------|-------------|
| Missing Vue Component Names | 18 | Vue.defineComponent() without name property |
| Undefined Globals | ~15 | widgetRegistry, WebSocket, atob, module, require |
| Duplicate Keys | 4 | Duplicate object keys in Vue components |
| Empty Blocks | ~10 | Empty catch/if blocks |
| Unused Variables | 5 | Defined but never used variables |
| Hardcoded Inline Colors | 1 | Inline style with hardcoded color |

## Files with Most Violations

1. `styles.css` - Main stylesheet with legacy hardcoded values
2. `app.js` - Main application with duplicate keys and empty blocks
3. `components/*.js` - Vue components missing name properties

## Recommended Actions

1. **High Priority**: Add `name` property to all Vue components
2. **Medium Priority**: Replace hardcoded colors with CSS variables
3. **Medium Priority**: Replace arbitrary spacing with spacing tokens
4. **Low Priority**: Remove !important declarations where possible
5. **Low Priority**: Update vendor prefixes (many may be auto-fixable)

## Auto-Fixable Issues

193 Stylelint errors are potentially fixable with `npm run lint:frontend:style:fix`

## Running the Linter

From project root:
```bash
npm run lint:frontend:style      # Run all linters
npm run lint:frontend:style:fix  # Auto-fix where possible
```

From frontEnd directory:
```bash
npm run lint        # Run all linters
npm run lint:fix    # Auto-fix where possible
npm run lint:style  # Stylelint only
npm run lint:js     # ESLint only
```
