/**
 * Ingredient Formatting Utility
 * Formats recipe ingredients for shopping list items
 * 
 * **Feature: recipe-shopping-integration**
 * **Validates: Requirements 1.5, 1.6**
 */

/**
 * Clean up ingredient name by removing common annotations
 * @param {string} name - Raw ingredient name
 * @returns {string} Cleaned ingredient name
 */
function cleanIngredientName(name) {
  if (!name || typeof name !== 'string') return '';
  
  let cleaned = name.trim();
  
  // Remove leading bullet points, dashes, asterisks
  cleaned = cleaned.replace(/^[\s•\-\*\u2022\u2023\u25E6\u2043\u2219]+/, '');
  
  // Remove common parenthetical annotations that aren't useful for shopping
  // e.g., "(divided)", "(optional)", "(room temperature)", "(softened)"
  const annotationsToRemove = [
    /\s*\(divided\)/gi,
    /\s*\(room\s+temp(?:erature)?\)/gi,
    /\s*\(softened\)/gi,
    /\s*\(melted\)/gi,
    /\s*\(at\s+room\s+temp(?:erature)?\)/gi,
    /\s*\(cold\)/gi,
    /\s*\(warm\)/gi,
    /\s*\(hot\)/gi,
    /\s*\(chilled\)/gi,
    /\s*\(frozen\)/gi,
    /\s*\(thawed\)/gi,
    /\s*\(drained\)/gi,
    /\s*\(rinsed\)/gi,
    /\s*\(drained\s+and\s+rinsed\)/gi,
    /\s*\(chopped\)/gi,
    /\s*\(diced\)/gi,
    /\s*\(minced\)/gi,
    /\s*\(sliced\)/gi,
    /\s*\(cubed\)/gi,
    /\s*\(shredded\)/gi,
    /\s*\(grated\)/gi,
    /\s*\(crushed\)/gi,
    /\s*\(beaten\)/gi,
    /\s*\(whisked\)/gi,
    /\s*\(sifted\)/gi,
    /\s*\(packed\)/gi,
    /\s*\(lightly\s+packed\)/gi,
    /\s*\(firmly\s+packed\)/gi,
    /\s*\(plus\s+more\s+for\s+.*?\)/gi,
    /\s*\(or\s+more\s+to\s+taste\)/gi,
    /\s*\(to\s+taste\)/gi,
    /\s*\(for\s+serving\)/gi,
    /\s*\(for\s+garnish\)/gi,
    /\s*\(garnish\)/gi
  ];
  
  for (const pattern of annotationsToRemove) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Clean up any double spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Format an ingredient for the shopping list
 * @param {Object} ingredient - Recipe ingredient object with name, quantity, unit, notes
 * @param {boolean} includeQuantity - Whether to include quantity/unit in the name
 * @returns {Object} Shopping item data with formatted name
 */
function formatIngredientForShopping(ingredient, includeQuantity) {
  if (!ingredient || typeof ingredient.name !== 'string') {
    return {
      name: '',
      category: 'Grocery',
      notes: '',
      quantity: ''
    };
  }

  // Clean the ingredient name
  let name = cleanIngredientName(ingredient.name);
  
  if (!name) {
    return {
      name: '',
      category: 'Grocery',
      notes: '',
      quantity: ''
    };
  }

  if (includeQuantity && ingredient.quantity != null) {
    const unit = ingredient.unit ? ingredient.unit.trim() : '';
    const quantityStr = String(ingredient.quantity);
    name = unit 
      ? `${name}, ${quantityStr} ${unit}`.trim()
      : `${name}, ${quantityStr}`.trim();
  }

  return {
    name: name,
    category: 'Grocery',
    notes: ingredient.notes || '',
    quantity: ''
  };
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatIngredientForShopping };
}

if (typeof window !== 'undefined') {
  window.formatIngredientForShopping = formatIngredientForShopping;
}
