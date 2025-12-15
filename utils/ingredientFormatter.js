/**
 * Ingredient Formatting Utility
 * Formats recipe ingredients for shopping list items
 * 
 * **Feature: recipe-shopping-integration**
 * **Validates: Requirements 1.5, 1.6**
 */

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

  let name = ingredient.name.trim();

  if (includeQuantity && ingredient.quantity != null) {
    const unit = ingredient.unit ? ingredient.unit.trim() : '';
    const quantityStr = String(ingredient.quantity);
    name = unit 
      ? `${ingredient.name.trim()}, ${quantityStr} ${unit}`.trim()
      : `${ingredient.name.trim()}, ${quantityStr}`.trim();
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
