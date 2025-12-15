/**
 * Fuzzy Search Utility
 * Provides fuzzy matching for quicklist filtering
 * 
 * **Feature: recipe-shopping-integration**
 * **Validates: Requirements 4.3**
 */

/**
 * Check if a search query fuzzy-matches an item name
 * Matches if all characters in query appear in order in itemName (case-insensitive)
 * 
 * @param {string} query - Search query (case-insensitive)
 * @param {string} itemName - Item name to match against
 * @returns {boolean} True if matches
 */
export function fuzzyMatch(query, itemName) {
  // Empty or whitespace-only query matches everything
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return true;
  }
  
  // Invalid itemName doesn't match
  if (!itemName || typeof itemName !== 'string') {
    return false;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedName = itemName.toLowerCase();
  
  // Check if all characters in query appear in order in itemName
  let queryIndex = 0;
  for (let i = 0; i < normalizedName.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedName[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === normalizedQuery.length;
}
