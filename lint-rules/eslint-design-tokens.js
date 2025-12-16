/**
 * ESLint Plugin for Design Token Enforcement
 * 
 * Custom rules for enforcing design system patterns in JavaScript/Vue code:
 * - no-hardcoded-inline-colors: Warns on hardcoded hex colors in inline styles
 * - require-vue-component-name: Requires name property in Vue.defineComponent
 * - require-pinia-store: Requires defineStore in store files
 */

// Color detection patterns
const HEX_COLOR_PATTERN = /#([0-9a-fA-F]{3}){1,2}\b/g;
const RGB_COLOR_PATTERN = /rgba?\s*\([^)]+\)/gi;
const HSL_COLOR_PATTERN = /hsla?\s*\([^)]+\)/gi;

// Allowed patterns that should not trigger warnings
const ALLOWED_COLOR_PATTERNS = [
  /var\s*\(\s*--color-/,
  /var\s*\(\s*--gradient-/
];



/**
 * Check if a value contains hardcoded colors
 * @param {string} value - The string value to check
 * @returns {Array} Array of found hardcoded colors
 */
function findHardcodedColors(value) {
  if (!value || typeof value !== 'string') return [];
  
  // Skip if using allowed patterns (CSS variables)
  if (ALLOWED_COLOR_PATTERNS.some(pattern => pattern.test(value))) {
    return [];
  }
  
  const colors = [];
  
  // Find hex colors
  const hexMatches = value.match(HEX_COLOR_PATTERN);
  if (hexMatches) {
    colors.push(...hexMatches);
  }
  
  // Find RGB/RGBA colors
  const rgbMatches = value.match(RGB_COLOR_PATTERN);
  if (rgbMatches) {
    colors.push(...rgbMatches);
  }
  
  // Find HSL/HSLA colors
  const hslMatches = value.match(HSL_COLOR_PATTERN);
  if (hslMatches) {
    colors.push(...hslMatches);
  }
  
  return colors;
}

/**
 * Check if a string looks like it contains inline style with colors
 * @param {string} str - The string to check
 * @returns {boolean}
 */
function containsInlineStyleWithColor(str) {
  if (!str || typeof str !== 'string') return false;
  
  // Look for style attribute patterns
  const stylePatterns = [
    /style\s*=\s*["'][^"']*#[0-9a-fA-F]{3,6}/i,
    /style\s*=\s*["'][^"']*rgba?\s*\(/i,
    /style\s*=\s*["'][^"']*hsla?\s*\(/i,
    /style\s*:\s*["'`][^"'`]*#[0-9a-fA-F]{3,6}/i,
    /\.style\.[a-zA-Z]+\s*=\s*["'`][^"'`]*#[0-9a-fA-F]{3,6}/i
  ];
  
  return stylePatterns.some(pattern => pattern.test(str));
}

// Rule: no-hardcoded-inline-colors
const noHardcodedInlineColors = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded colors in inline styles',
      category: 'Design System',
      recommended: true
    },
    messages: {
      hardcodedColor: 'Hardcoded color "{{color}}" in inline style. Use CSS classes or var(--color-*) instead.',
      suggestCssClass: 'Consider extracting this to a CSS class using design tokens.'
    },
    schema: []
  },
  create(context) {
    return {
      // Check template literals (backtick strings)
      TemplateLiteral(node) {
        // Get the full template string content
        const quasis = node.quasis || [];
        for (const quasi of quasis) {
          const value = quasi.value?.raw || quasi.value?.cooked || '';
          
          if (containsInlineStyleWithColor(value)) {
            const colors = findHardcodedColors(value);
            for (const color of colors) {
              context.report({
                node: quasi,
                messageId: 'hardcodedColor',
                data: { color }
              });
            }
          }
        }
      },
      
      // Check regular string literals
      Literal(node) {
        if (typeof node.value !== 'string') return;
        
        const value = node.value;
        if (containsInlineStyleWithColor(value)) {
          const colors = findHardcodedColors(value);
          for (const color of colors) {
            context.report({
              node,
              messageId: 'hardcodedColor',
              data: { color }
            });
          }
        }
      }
    };
  }
};

// Rule: require-vue-component-name
const requireVueComponentName = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require name property in Vue.defineComponent calls',
      category: 'Vue Best Practices',
      recommended: true
    },
    messages: {
      missingName: 'Vue components must have a "name" property defined in Vue.defineComponent().'
    },
    schema: []
  },
  create(context) {
    return {
      CallExpression(node) {
        // Check for Vue.defineComponent() pattern
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'Vue' &&
          node.callee.property.name === 'defineComponent'
        ) {
          const args = node.arguments;
          
          // First argument should be an object
          if (args.length > 0 && args[0].type === 'ObjectExpression') {
            const properties = args[0].properties;
            
            // Check if 'name' property exists
            const hasName = properties.some(prop => {
              return (
                prop.type === 'Property' &&
                prop.key &&
                (prop.key.name === 'name' || prop.key.value === 'name')
              );
            });
            
            if (!hasName) {
              context.report({
                node,
                messageId: 'missingName'
              });
            }
          }
        }
      }
    };
  }
};

// Rule: require-pinia-store
const requirePiniaStore = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require defineStore() in store files',
      category: 'Pinia Best Practices',
      recommended: true
    },
    messages: {
      missingDefineStore: 'Store files must export a Pinia store using defineStore() or Pinia.defineStore().'
    },
    schema: []
  },
  create(context) {
    let hasDefineStore = false;
    
    return {
      CallExpression(node) {
        // Check for defineStore() or Pinia.defineStore()
        if (
          (node.callee.type === 'Identifier' && node.callee.name === 'defineStore') ||
          (node.callee.type === 'MemberExpression' &&
           node.callee.object.name === 'Pinia' &&
           node.callee.property.name === 'defineStore')
        ) {
          hasDefineStore = true;
        }
      },
      'Program:exit'(node) {
        if (!hasDefineStore) {
          context.report({
            node,
            messageId: 'missingDefineStore'
          });
        }
      }
    };
  }
};

// Export the plugin
module.exports = {
  rules: {
    'no-hardcoded-inline-colors': noHardcodedInlineColors,
    'require-vue-component-name': requireVueComponentName,
    'require-pinia-store': requirePiniaStore
  }
};
