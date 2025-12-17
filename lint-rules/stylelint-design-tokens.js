/**
 * Stylelint Design Tokens Plugin
 * 
 * Custom Stylelint plugin that enforces the use of design tokens
 * (CSS custom properties) instead of hardcoded values for colors,
 * spacing, and border-radius.
 * 
 * Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 4.1, 4.2
 */

const stylelint = require('stylelint');

// Plugin namespace
const namespace = 'design-tokens';

// ============================================================================
// Rule: no-hardcoded-colors
// Detects hardcoded color values and requires CSS variables
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
// ============================================================================

const noHardcodedColorsRuleName = `${namespace}/no-hardcoded-colors`;
const noHardcodedColorsMessages = stylelint.utils.ruleMessages(noHardcodedColorsRuleName, {
  rejected: (value) => `Hardcoded color "${value}" detected. Use a CSS variable like var(--color-primary-500) instead.`
});

// Color detection patterns
const HEX_COLOR_3 = /#[0-9a-fA-F]{3}\b/g;
const HEX_COLOR_6 = /#[0-9a-fA-F]{6}\b/g;
const RGB_COLOR = /rgba?\s*\([^)]+\)/gi;
const HSL_COLOR = /hsla?\s*\([^)]+\)/gi;

// Default allowed keywords
const DEFAULT_ALLOWED_KEYWORDS = [
  'white', 'black', 'transparent', 'inherit', 'currentcolor', 'none', 'initial', 'unset'
];

// Default allowed patterns (CSS variables)
const DEFAULT_ALLOWED_PATTERNS = [
  /var\s*\(\s*--color-/i,
  /var\s*\(\s*--gradient-/i
];

const noHardcodedColorsRule = stylelint.createPlugin(
  noHardcodedColorsRuleName,
  (enabled, options) => {
    return (root, result) => {
      const validOptions = stylelint.utils.validateOptions(result, noHardcodedColorsRuleName, {
        actual: enabled,
        possible: [true, false]
      });

      if (!validOptions || !enabled) return;

      const allowedKeywords = options?.allowedKeywords 
        ? options.allowedKeywords.map(k => k.toLowerCase())
        : DEFAULT_ALLOWED_KEYWORDS;
      
      const allowedPatterns = options?.allowedPatterns
        ? options.allowedPatterns.map(p => typeof p === 'string' ? new RegExp(p, 'i') : p)
        : DEFAULT_ALLOWED_PATTERNS;

      root.walkDecls((decl) => {
        const value = decl.value;
        const prop = decl.prop;

        // Skip CSS custom property definitions (--color-*, --gradient-*, etc.)
        // These ARE the token definitions, not violations
        if (prop.startsWith('--')) {
          return;
        }

        // Skip if using allowed patterns (CSS variables)
        if (allowedPatterns.some(pattern => pattern.test(value))) {
          return;
        }

        // Skip if entire value is an allowed keyword
        if (allowedKeywords.includes(value.toLowerCase().trim())) {
          return;
        }

        // Check for hardcoded hex colors (6-digit)
        const hex6Matches = value.match(HEX_COLOR_6);
        if (hex6Matches) {
          for (const match of hex6Matches) {
            stylelint.utils.report({
              message: noHardcodedColorsMessages.rejected(match),
              node: decl,
              result,
              ruleName: noHardcodedColorsRuleName
            });
          }
          return; // Don't double-report 3-digit matches within 6-digit
        }

        // Check for hardcoded hex colors (3-digit)
        const hex3Matches = value.match(HEX_COLOR_3);
        if (hex3Matches) {
          for (const match of hex3Matches) {
            stylelint.utils.report({
              message: noHardcodedColorsMessages.rejected(match),
              node: decl,
              result,
              ruleName: noHardcodedColorsRuleName
            });
          }
        }

        // Check for RGB/RGBA colors
        const rgbMatches = value.match(RGB_COLOR);
        if (rgbMatches) {
          for (const match of rgbMatches) {
            stylelint.utils.report({
              message: noHardcodedColorsMessages.rejected(match),
              node: decl,
              result,
              ruleName: noHardcodedColorsRuleName
            });
          }
        }

        // Check for HSL/HSLA colors
        const hslMatches = value.match(HSL_COLOR);
        if (hslMatches) {
          for (const match of hslMatches) {
            stylelint.utils.report({
              message: noHardcodedColorsMessages.rejected(match),
              node: decl,
              result,
              ruleName: noHardcodedColorsRuleName
            });
          }
        }
      });
    };
  }
);

noHardcodedColorsRule.ruleName = noHardcodedColorsRuleName;
noHardcodedColorsRule.messages = noHardcodedColorsMessages;

// ============================================================================
// Rule: no-arbitrary-spacing
// Detects arbitrary pixel values for spacing properties
// Requirements: 3.1, 3.2
// ============================================================================

const noArbitrarySpacingRuleName = `${namespace}/no-arbitrary-spacing`;
const noArbitrarySpacingMessages = stylelint.utils.ruleMessages(noArbitrarySpacingRuleName, {
  rejected: (prop, value) => `Arbitrary spacing "${value}" on "${prop}". Use var(--space-*) tokens instead.`
});

// Spacing properties to check
const SPACING_PROPERTIES = [
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'gap', 'row-gap', 'column-gap'
];

// Pattern to detect arbitrary pixel values
const ARBITRARY_PX = /\d+px/i;

// Default allowed spacing values
const DEFAULT_ALLOWED_SPACING_VALUES = ['0', 'auto', 'inherit', 'initial', 'unset'];

// Default allowed spacing patterns
const DEFAULT_ALLOWED_SPACING_PATTERNS = [
  /var\s*\(\s*--space-/i
];

const noArbitrarySpacingRule = stylelint.createPlugin(
  noArbitrarySpacingRuleName,
  (enabled, options) => {
    return (root, result) => {
      const validOptions = stylelint.utils.validateOptions(result, noArbitrarySpacingRuleName, {
        actual: enabled,
        possible: [true, false]
      });

      if (!validOptions || !enabled) return;

      const properties = options?.properties || SPACING_PROPERTIES;
      const allowedValues = options?.allowedValues || DEFAULT_ALLOWED_SPACING_VALUES;
      const allowedPatterns = options?.allowedPatterns
        ? options.allowedPatterns.map(p => typeof p === 'string' ? new RegExp(p, 'i') : p)
        : DEFAULT_ALLOWED_SPACING_PATTERNS;

      root.walkDecls((decl) => {
        const prop = decl.prop.toLowerCase();
        const value = decl.value;

        // Only check spacing properties
        if (!properties.some(p => prop === p || prop.startsWith(p + '-'))) {
          return;
        }

        // Skip if using allowed patterns (CSS variables)
        if (allowedPatterns.some(pattern => pattern.test(value))) {
          return;
        }

        // Skip allowed values
        const valueParts = value.split(/\s+/);
        const hasArbitraryPx = valueParts.some(part => {
          const trimmed = part.trim().toLowerCase();
          if (allowedValues.includes(trimmed)) return false;
          return ARBITRARY_PX.test(part);
        });

        if (hasArbitraryPx) {
          stylelint.utils.report({
            message: noArbitrarySpacingMessages.rejected(prop, value),
            node: decl,
            result,
            ruleName: noArbitrarySpacingRuleName
          });
        }
      });
    };
  }
);

noArbitrarySpacingRule.ruleName = noArbitrarySpacingRuleName;
noArbitrarySpacingRule.messages = noArbitrarySpacingMessages;

// ============================================================================
// Rule: no-arbitrary-radius
// Detects arbitrary border-radius values
// Requirements: 4.1, 4.2
// ============================================================================

const noArbitraryRadiusRuleName = `${namespace}/no-arbitrary-radius`;
const noArbitraryRadiusMessages = stylelint.utils.ruleMessages(noArbitraryRadiusRuleName, {
  rejected: (value) => `Arbitrary border-radius "${value}". Use var(--radius-*) tokens instead.`
});

// Border-radius properties
const RADIUS_PROPERTIES = [
  'border-radius',
  'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius'
];

// Default allowed radius values
const DEFAULT_ALLOWED_RADIUS_VALUES = ['0', '50%', 'inherit', 'initial', 'unset'];

// Default allowed radius patterns
const DEFAULT_ALLOWED_RADIUS_PATTERNS = [
  /var\s*\(\s*--radius-/i
];

// Pattern to detect arbitrary values (px, em, rem, or plain numbers)
const ARBITRARY_RADIUS = /\d+(px|em|rem)?/i;

const noArbitraryRadiusRule = stylelint.createPlugin(
  noArbitraryRadiusRuleName,
  (enabled, options) => {
    return (root, result) => {
      const validOptions = stylelint.utils.validateOptions(result, noArbitraryRadiusRuleName, {
        actual: enabled,
        possible: [true, false]
      });

      if (!validOptions || !enabled) return;

      const allowedValues = options?.allowedValues || DEFAULT_ALLOWED_RADIUS_VALUES;
      const allowedPatterns = options?.allowedPatterns
        ? options.allowedPatterns.map(p => typeof p === 'string' ? new RegExp(p, 'i') : p)
        : DEFAULT_ALLOWED_RADIUS_PATTERNS;

      root.walkDecls((decl) => {
        const prop = decl.prop.toLowerCase();
        const value = decl.value;

        // Only check border-radius properties
        if (!RADIUS_PROPERTIES.includes(prop)) {
          return;
        }

        // Skip if using allowed patterns (CSS variables)
        if (allowedPatterns.some(pattern => pattern.test(value))) {
          return;
        }

        // Skip allowed values
        const valueParts = value.split(/\s+/);
        const hasArbitraryRadius = valueParts.some(part => {
          const trimmed = part.trim().toLowerCase();
          if (allowedValues.includes(trimmed)) return false;
          return ARBITRARY_RADIUS.test(part);
        });

        if (hasArbitraryRadius) {
          stylelint.utils.report({
            message: noArbitraryRadiusMessages.rejected(value),
            node: decl,
            result,
            ruleName: noArbitraryRadiusRuleName
          });
        }
      });
    };
  }
);

noArbitraryRadiusRule.ruleName = noArbitraryRadiusRuleName;
noArbitraryRadiusRule.messages = noArbitraryRadiusMessages;

// ============================================================================
// Export all rules as a plugin
// ============================================================================

module.exports = [
  noHardcodedColorsRule,
  noArbitrarySpacingRule,
  noArbitraryRadiusRule
];

// Also export individual rules for testing
module.exports.rules = {
  'no-hardcoded-colors': noHardcodedColorsRule,
  'no-arbitrary-spacing': noArbitrarySpacingRule,
  'no-arbitrary-radius': noArbitraryRadiusRule
};
