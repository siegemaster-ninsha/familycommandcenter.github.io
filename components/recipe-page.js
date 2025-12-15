// Recipe Page Component
// Allows users to scrape recipes from URLs, save them, and manage their recipe collection
//
// **Feature: recipe-scraper**
// **Validates: Requirements 1.4, 4.2, 5.3, 7.1, 7.2, 7.3, 8.1, 8.2, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2**

const RecipePage = Vue.defineComponent({
  template: `
    <div class="space-y-6 pb-24 sm:pb-0">
      <!-- URL Scraper Section -->
      <div class="w-full">
        <div class="w-full block rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2 mb-4">
            <div v-html="Helpers.IconLibrary.getIcon('link', 'lucide', 20, 'text-primary-custom')"></div>
            Scrape Recipe from URL
          </h2>
          
          <!-- LLM Health Status -->
          <div v-if="llmHealth" class="mb-4 flex items-center gap-2 text-sm">
            <div 
              class="w-2 h-2 rounded-full"
              :class="llmHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'"
            ></div>
            <span :class="llmHealth.status === 'healthy' ? 'text-green-600' : 'text-red-600'">
              {{ llmHealth.status === 'healthy' ? 'Recipe extraction service online' : 'Recipe extraction service offline' }}
            </span>
            <button 
              v-if="llmHealth.status !== 'healthy'"
              @click="checkLLMHealth"
              class="text-xs text-primary-500 hover:underline"
            >
              Retry
            </button>
          </div>
          
          <!-- URL Input Form -->
          <form @submit.prevent="handleScrape" class="space-y-4">
            <div class="flex flex-col sm:flex-row gap-3">
              <input
                v-model="scrapeUrl"
                type="url"
                placeholder="Paste recipe URL here (e.g., https://example.com/recipe)"
                class="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                style="border-color: var(--color-border-card)"
                :disabled="scraping || imageProcessing"
                required
              >
              <button
                type="submit"
                class="btn-primary flex items-center justify-center gap-2 px-6 py-3 min-w-[140px]"
                :disabled="scraping || imageProcessing || !scrapeUrl"
              >
                <div v-if="scraping" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <div v-else v-html="Helpers.IconLibrary.getIcon('download', 'lucide', 18, 'text-white')"></div>
                <span>{{ scraping ? 'Scraping...' : 'Scrape Recipe' }}</span>
              </button>
            </div>
            
            <!-- Divider with "or" -->
            <div class="flex items-center gap-4">
              <div class="flex-1 border-t" style="border-color: var(--color-border-card)"></div>
              <span class="text-sm text-secondary-custom">or</span>
              <div class="flex-1 border-t" style="border-color: var(--color-border-card)"></div>
            </div>
            
            <!-- Capture Recipe Button -->
            <!-- **Feature: recipe-image-capture** -->
            <!-- **Validates: Requirements 1.1** -->
            <button
              type="button"
              @click="openImageCapture"
              class="w-full btn-secondary flex items-center justify-center gap-2 px-6 py-3"
              :disabled="scraping || imageProcessing"
            >
              <div v-html="Helpers.IconLibrary.getIcon('camera', 'lucide', 18, '')"></div>
              <span>Capture Recipe from Photo</span>
            </button>
          </form>
          
          <!-- Image Processing Status -->
          <!-- **Feature: recipe-image-capture** -->
          <!-- **Validates: Requirements 5.2, 5.3, 5.4** -->
          <div v-if="imageProcessing" class="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div class="flex items-center gap-3">
              <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-blue-700">{{ imageProcessingStatus || 'Processing image...' }}</span>
            </div>
          </div>
          
          <!-- Image Error -->
          <div v-if="imageError" class="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <div class="flex items-start gap-3">
              <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 20, 'text-red-500')"></div>
              <div>
                <p class="font-medium text-red-700">Failed to process image</p>
                <p class="text-sm text-red-600 mt-1">{{ imageError }}</p>
              </div>
            </div>
          </div>
          
          <!-- Scrape Error -->
          <div v-if="scrapeError" class="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <div class="flex items-start gap-3">
              <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 20, 'text-red-500')"></div>
              <div>
                <p class="font-medium text-red-700">Failed to scrape recipe</p>
                <p class="text-sm text-red-600 mt-1">{{ scrapeError }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Scraped Recipe Preview -->
      <div v-if="scrapedRecipe" class="w-full">
        <div class="w-full block rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
              <div v-html="Helpers.IconLibrary.getIcon('sparkles', 'lucide', 20, 'text-primary-custom')"></div>
              Scraped Recipe Preview
            </h2>
            <button
              @click="clearScrapedRecipe"
              class="text-secondary-custom hover:text-primary-custom transition-colors"
              title="Clear preview"
            >
              <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 20, '')"></div>
            </button>
          </div>
          
          <!-- Recipe Preview Card -->
          <div class="space-y-4">
            <div>
              <h3 class="text-xl font-bold text-primary-custom">{{ scrapedRecipe.title }}</h3>
              <p v-if="scrapedRecipe.servings" class="text-sm text-secondary-custom mt-1">
                Serves: {{ scrapedRecipe.servings }}
              </p>
            </div>
            
            <!-- Ingredients Preview -->
            <div>
              <h4 class="font-semibold text-primary-custom mb-2">Ingredients</h4>
              <ul class="list-disc list-inside space-y-1 text-secondary-custom">
                <li v-for="(ing, idx) in scrapedRecipe.ingredients?.slice(0, 5)" :key="idx">
                  {{ formatIngredient(ing) }}
                </li>
                <li v-if="scrapedRecipe.ingredients?.length > 5" class="text-sm italic">
                  ... and {{ scrapedRecipe.ingredients.length - 5 }} more
                </li>
              </ul>
            </div>
            
            <!-- Instructions Preview -->
            <div>
              <h4 class="font-semibold text-primary-custom mb-2">Instructions</h4>
              <ol class="list-decimal list-inside space-y-1 text-secondary-custom">
                <li v-for="(step, idx) in scrapedRecipe.instructions?.slice(0, 3)" :key="idx">
                  {{ step.length > 100 ? step.substring(0, 100) + '...' : step }}
                </li>
                <li v-if="scrapedRecipe.instructions?.length > 3" class="text-sm italic">
                  ... and {{ scrapedRecipe.instructions.length - 3 }} more steps
                </li>
              </ol>
            </div>
            
            <!-- Save Options -->
            <div class="border-t pt-4 mt-4" style="border-color: var(--color-border-card);">
              <h4 class="font-semibold text-primary-custom mb-3">Save Recipe</h4>
              
              <!-- Tag Input -->
              <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Tags</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  <span
                    v-for="tag in selectedTags"
                    :key="tag"
                    class="px-3 py-1 rounded-full text-sm bg-secondary-500 text-white flex items-center gap-1"
                  >
                    {{ tag }}
                    <button @click="removeTag(tag)" class="hover:text-red-200">
                      <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 12, '')"></div>
                    </button>
                  </span>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="newTagInput"
                    type="text"
                    placeholder="Add a tag (e.g., quick, vegetarian)"
                    class="flex-1 px-3 py-2 border rounded-lg text-sm"
                    style="border-color: var(--color-border-card)"
                    @keyup.enter="addTag"
                  >
                  <button
                    @click="addTag"
                    class="btn-secondary px-4 py-2 text-sm"
                    :disabled="!newTagInput.trim()"
                  >
                    Add Tag
                  </button>
                </div>
                <!-- Suggested Tags -->
                <!-- **Feature: recipe-image-capture** -->
                <!-- **Validates: Requirements 11.4, 11.5** -->
                <div v-if="suggestedTags.length > 0" class="mt-3">
                  <span class="text-xs text-secondary-custom block mb-1">
                    {{ scrapedRecipe?.suggestedTags?.length > 0 ? 'AI Suggestions:' : 'Suggestions:' }}
                  </span>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="tag in suggestedTags"
                      :key="tag"
                      @click="addSuggestedTag(tag)"
                      class="px-3 py-1 rounded-full text-xs border border-primary-300 text-primary-600 bg-primary-50 hover:bg-primary-100 hover:border-primary-400 transition-colors flex items-center gap-1"
                    >
                      <span>+</span>
                      <span>{{ tag }}</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Save Button -->
              <div class="flex gap-3">
                <button
                  @click="saveScrapedRecipe"
                  class="btn-success flex items-center gap-2 px-6 py-3"
                  :disabled="saving"
                >
                  <div v-if="saving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <div v-else v-html="Helpers.IconLibrary.getIcon('save', 'lucide', 18, 'text-white')"></div>
                  <span>{{ saving ? 'Saving...' : 'Save Recipe' }}</span>
                </button>
                <button
                  @click="clearScrapedRecipe"
                  class="btn-secondary px-6 py-3"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Saved Recipes Section -->
      <div class="w-full">
        <div class="w-full block rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <div class="flex items-center justify-between mb-4 sm:mb-6">
            <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
              <div v-html="Helpers.IconLibrary.getIcon('book', 'lucide', 20, 'text-primary-custom')"></div>
              My Recipes
              <span class="text-sm font-normal text-secondary-custom">({{ filteredRecipes.length }})</span>
            </h2>
          </div>
          
          <!-- Tag Filter -->
          <div class="flex flex-wrap gap-3 mb-4">
            <div class="flex-1 min-w-[200px]">
              <select
                v-model="filterTag"
                class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                style="border-color: var(--color-border-card)"
              >
                <option value="">All Tags</option>
                <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
              </select>
            </div>
            
            <!-- Clear Filter -->
            <button
              v-if="filterTag"
              @click="clearFilters"
              class="px-4 py-2 text-sm text-secondary-custom hover:text-primary-custom transition-colors flex items-center gap-1"
            >
              <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 14, '')"></div>
              Clear Filter
            </button>
          </div>
          
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-8">
            <div class="w-8 h-8 border-4 rounded-full border-primary-500 border-t-transparent animate-spin mx-auto"></div>
            <p class="text-secondary-custom mt-2">Loading recipes...</p>
          </div>
          
          <!-- Error State -->
          <div v-else-if="error" class="text-center py-8" style="color: var(--color-error-700);">
            <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 48, '')" class="mx-auto mb-3"></div>
            <p class="font-medium">Error loading recipes</p>
            <p class="text-sm mt-1">{{ error }}</p>
            <button 
              @click="loadRecipes"
              class="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="filteredRecipes.length === 0" class="text-center py-8 text-secondary-custom">
            <div v-html="Helpers.IconLibrary.getIcon('book', 'lucide', 48, 'mx-auto mb-3 opacity-50')" class="mx-auto mb-3 opacity-50"></div>
            <p v-if="recipes.length === 0">No recipes saved yet.</p>
            <p v-else>No recipes match your filters.</p>
            <p class="text-sm mt-1">{{ recipes.length === 0 ? 'Paste a recipe URL above to get started!' : 'Try adjusting your filters.' }}</p>
          </div>
          
          <!-- Recipe Grid -->
          <!-- **Feature: recipe-image-capture** -->
          <!-- **Validates: Requirements 8.2** -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="recipe in filteredRecipes"
              :key="recipe.id"
              @click="openRecipeModal(recipe)"
              class="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md"
              style="background-color: var(--color-bg-primary); border-color: var(--color-border-card);"
            >
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-semibold text-primary-custom line-clamp-2 flex-1">{{ recipe.title }}</h3>
                <!-- Source indicator: multi-image, single image, or URL -->
                <!-- **Feature: multi-image-recipe-categories** -->
                <!-- **Validates: Requirements 9.2** -->
                <div 
                  v-if="recipe.sourceImageKeys?.length > 1" 
                  class="flex-shrink-0 text-blue-500 flex items-center gap-0.5" 
                  :title="recipe.sourceImageKeys.length + ' photos'"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('images', 'lucide', 16, '')"></div>
                  <span class="text-xs">{{ recipe.sourceImageKeys.length }}</span>
                </div>
                <div 
                  v-else-if="recipe.sourceImageKeys?.length === 1 || recipe.sourceImageKey" 
                  class="flex-shrink-0 text-blue-500" 
                  title="From photo"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('camera', 'lucide', 16, '')"></div>
                </div>
                <div 
                  v-else-if="recipe.sourceUrl" 
                  class="flex-shrink-0 text-gray-400" 
                  title="From URL"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('link', 'lucide', 16, '')"></div>
                </div>
              </div>
              <div class="flex flex-wrap gap-1 mb-2">
                <span
                  v-for="tag in recipe.tags?.slice(0, 3)"
                  :key="tag"
                  class="px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-700"
                >
                  {{ tag }}
                </span>
                <span v-if="recipe.tags?.length > 3" class="text-xs text-secondary-custom">
                  +{{ recipe.tags.length - 3 }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm text-secondary-custom">
                <span>{{ recipe.ingredients?.length || 0 }} ingredients</span>
                <span>{{ recipe.servings ? recipe.servings + ' servings' : '' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recipe Detail Modal -->
      <div v-if="showRecipeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <!-- Modal Header -->
          <div class="sticky top-0 bg-white border-b p-4 flex items-center justify-between" style="border-color: var(--color-border-card);">
            <h2 class="text-xl font-bold text-primary-custom">{{ currentRecipe?.title }}</h2>
            <button
              @click="closeRecipeModal"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 20, '')"></div>
            </button>
          </div>
          
          <!-- Modal Content -->
          <div class="p-6 space-y-6">
            <!-- Recipe Scale Selector -->
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 p-4 rounded-lg bg-gray-50">
              <label class="font-medium">Scale:</label>
              <div class="flex items-center gap-3 flex-shrink-0">
                <button
                  @click="decreaseScale"
                  class="rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style="width: 40px; height: 40px; min-width: 40px; min-height: 40px;"
                  :disabled="scaleMultiplier <= 1"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('minus', 'lucide', 20, '')"></div>
                </button>
                <span class="w-12 text-center font-bold text-xl flex-shrink-0">{{ scaleMultiplier }}x</span>
                <button
                  @click="increaseScale"
                  class="rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                  style="width: 40px; height: 40px; min-width: 40px; min-height: 40px;"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 20, '')"></div>
                </button>
              </div>
              <span class="text-sm text-secondary-custom whitespace-nowrap">
                ({{ scaledServings }} servings)
              </span>
            </div>
            
            <!-- Tags -->
            <div v-if="currentRecipe?.tags?.length" class="flex flex-wrap gap-2">
              <span
                v-for="tag in currentRecipe?.tags"
                :key="'tag-' + tag"
                class="px-3 py-1 rounded-full text-sm bg-primary-500 text-white"
              >
                {{ tag }}
              </span>
            </div>
            
            <!-- Ingredients -->
            <div>
              <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 class="text-lg font-bold text-primary-custom flex items-center gap-2">
                  <div v-html="Helpers.IconLibrary.getIcon('list', 'lucide', 18, '')"></div>
                  Ingredients
                </h3>
              </div>
              
              <!-- Quick select buttons + Add to Cart -->
              <div class="flex gap-2 mb-3 text-xs items-center">
                <button
                  @click="selectAllIngredients"
                  class="btn-secondary px-2 py-1 text-xs"
                >
                  Select All
                </button>
                <button
                  @click="deselectAllIngredients"
                  class="btn-secondary px-2 py-1 text-xs"
                >
                  Deselect All
                </button>
                <button
                  @click="sendSelectedToShoppingList"
                  class="btn-success flex items-center gap-1.5 px-2 py-1 text-xs ml-auto"
                  title="Send selected ingredients to shopping list"
                  :disabled="sendingToShopping || selectedIngredients.size === 0"
                >
                  <div v-if="sendingToShopping" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <div v-else v-html="Helpers.IconLibrary.getIcon('shoppingCart', 'lucide', 14, 'text-white')"></div>
                  <span>Add ({{ selectedIngredients.size }}) to Cart</span>
                </button>
              </div>
              
              <!-- Redesigned ingredient selection UI -->
              <!-- **Feature: multi-image-recipe-categories** -->
              <!-- **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5** -->
              <ul class="space-y-2">
                <li
                  v-for="(ing, idx) in scaledIngredients"
                  :key="idx"
                  @click="toggleIngredient(idx)"
                  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                  :class="selectedIngredients.has(idx) 
                    ? 'bg-green-50 border-green-200 border' 
                    : 'hover:bg-gray-50 border border-transparent'"
                >
                  <!-- Selection indicator icon -->
                  <!-- **Validates: Requirements 10.3, 10.4** -->
                  <div class="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    <div v-if="selectedIngredients.has(idx)" 
                         v-html="Helpers.IconLibrary.getIcon('squareCheck', 'lucide', 20, 'text-green-600')">
                    </div>
                    <div v-else 
                         v-html="Helpers.IconLibrary.getIcon('square', 'lucide', 20, 'text-gray-300')">
                    </div>
                  </div>
                  
                  <!-- Ingredient text -->
                  <span class="flex-1">{{ formatIngredient(ing) }}</span>
                  
                  <!-- Category badge (if ingredient has category) -->
                  <!-- **Feature: multi-image-recipe-categories** -->
                  <!-- **Validates: Requirements 6.1, 6.2** -->
                  <span 
                    v-if="ing.category"
                    @click.stop="openCategoryDropdown(idx, $event)"
                    class="px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                    :style="getCategoryBadgeStyle(ing.category)"
                  >
                    {{ ing.category }}
                  </span>
                  
                  <!-- Shopping cart icon for quick add -->
                  <button
                    @click.stop="addSingleIngredientToShopping(idx)"
                    class="flex-shrink-0 p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                    title="Add to shopping list"
                  >
                    <div v-html="Helpers.IconLibrary.getIcon('shoppingCart', 'lucide', 18, '')"></div>
                  </button>
                </li>
              </ul>
              
              <!-- Category dropdown (positioned absolutely) -->
              <div 
                v-if="categoryDropdownVisible"
                class="fixed z-50 bg-white rounded-lg shadow-lg border py-1 min-w-[140px]"
                :style="categoryDropdownStyle"
                @click.stop
              >
                <button
                  v-for="cat in shoppingCategories"
                  :key="cat"
                  @click="selectCategory(cat)"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                  :class="{ 'bg-gray-50': currentRecipe?.ingredients?.[categoryDropdownIndex]?.category === cat }"
                >
                  <span 
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: getCategoryColors(cat).background }"
                  ></span>
                  {{ cat }}
                </button>
              </div>
            </div>
            
            <!-- Instructions -->
            <div>
              <h3 class="text-lg font-bold text-primary-custom mb-3 flex items-center gap-2">
                <div v-html="Helpers.IconLibrary.getIcon('chefHat', 'lucide', 18, '')"></div>
                Instructions
              </h3>
              <ol class="space-y-4">
                <li
                  v-for="(step, idx) in currentRecipe?.instructions"
                  :key="idx"
                  class="flex gap-4"
                >
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                    {{ idx + 1 }}
                  </span>
                  <p class="flex-1 pt-1">{{ step }}</p>
                </li>
              </ol>
            </div>
            
            <!-- Source URL -->
            <div v-if="currentRecipe?.sourceUrl" class="text-sm text-secondary-custom">
              <a 
                :href="currentRecipe.sourceUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                class="flex items-center gap-1 hover:text-primary-500 transition-colors"
              >
                <div v-html="Helpers.IconLibrary.getIcon('externalLink', 'lucide', 14, '')"></div>
                View original recipe
              </a>
            </div>
            
            <!-- Source Image(s) -->
            <!-- **Feature: multi-image-recipe-categories** -->
            <!-- **Validates: Requirements 9.2, 9.3** -->
            <div v-if="hasSourceImages" class="border-t pt-4" style="border-color: var(--color-border-card);">
              <h4 class="font-semibold text-primary-custom mb-3 flex items-center gap-2">
                <div v-html="Helpers.IconLibrary.getIcon('image', 'lucide', 18, '')"></div>
                Source Images
                <span v-if="sourceImageCount > 1" class="text-sm font-normal text-secondary-custom">
                  ({{ currentImageIndex + 1 }} of {{ sourceImageCount }})
                </span>
              </h4>
              
              <!-- Multi-image navigation -->
              <div v-if="sourceImageCount > 1" class="flex items-center justify-center gap-4 mb-3">
                <button
                  @click="prevSourceImage"
                  :disabled="currentImageIndex === 0"
                  class="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous image"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('chevronLeft', 'lucide', 20, '')"></div>
                </button>
                
                <!-- Image indicator dots -->
                <div class="flex gap-2">
                  <button
                    v-for="(_, idx) in sourceImageCount"
                    :key="idx"
                    @click="goToSourceImage(idx)"
                    class="w-2.5 h-2.5 rounded-full transition-colors"
                    :class="idx === currentImageIndex ? 'bg-primary-500' : 'bg-gray-300 hover:bg-gray-400'"
                    :title="'Image ' + (idx + 1)"
                  ></button>
                </div>
                
                <button
                  @click="nextSourceImage"
                  :disabled="currentImageIndex >= sourceImageCount - 1"
                  class="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next image"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('chevronRight', 'lucide', 20, '')"></div>
                </button>
              </div>
              
              <!-- View image button -->
              <button 
                @click="viewCurrentSourceImage"
                :disabled="loadingSourceImage"
                class="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                style="border-color: var(--color-border-card)"
              >
                <div v-if="loadingSourceImage" class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <div v-else v-html="Helpers.IconLibrary.getIcon('externalLink', 'lucide', 16, '')"></div>
                <span>{{ loadingSourceImage ? 'Loading...' : 'View original image' }}</span>
              </button>
            </div>
          </div>
          
          <!-- Modal Footer -->
          <div class="sticky bottom-0 bg-white border-t px-4 py-2 flex justify-between items-center" style="border-color: var(--color-border-card);">
            <button
              @click="confirmDeleteRecipe"
              class="btn-warning flex items-center gap-1.5 px-3 py-1.5 text-sm"
            >
              <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14, 'text-white')"></div>
              Delete
            </button>
            <div class="flex gap-2">
              <button
                @click="openEditModal"
                class="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <div v-html="Helpers.IconLibrary.getIcon('edit', 'lucide', 14, '')"></div>
                Edit
              </button>
              <button
                @click="closeRecipeModal"
                class="btn-primary px-4 py-1.5 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Recipe Modal -->
      <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <h2 class="text-xl font-bold text-primary-custom mb-4">Edit Recipe</h2>
            
            <form @submit.prevent="saveEditedRecipe" class="space-y-4">
              <!-- Title -->
              <div>
                <label class="block text-sm font-medium mb-1">Title</label>
                <input
                  v-model="editForm.title"
                  type="text"
                  class="w-full p-2 border rounded-lg"
                  style="border-color: var(--color-border-card)"
                  required
                >
              </div>
              
              <!-- Servings -->
              <div>
                <label class="block text-sm font-medium mb-1">Servings</label>
                <input
                  v-model.number="editForm.servings"
                  type="number"
                  min="1"
                  class="w-full p-2 border rounded-lg"
                  style="border-color: var(--color-border-card)"
                >
              </div>
              
              <!-- Tags -->
              <div>
                <label class="block text-sm font-medium mb-1">Tags</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  <span
                    v-for="tag in editForm.tags"
                    :key="tag"
                    class="px-3 py-1 rounded-full text-sm bg-secondary-500 text-white flex items-center gap-1"
                  >
                    {{ tag }}
                    <button type="button" @click="removeEditTag(tag)" class="hover:text-red-200">
                      <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 12, '')"></div>
                    </button>
                  </span>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="editTagInput"
                    type="text"
                    placeholder="Add tag"
                    class="flex-1 px-3 py-2 border rounded-lg text-sm"
                    style="border-color: var(--color-border-card)"
                    @keyup.enter.prevent="addEditTag"
                  >
                  <button
                    type="button"
                    @click="addEditTag"
                    class="btn-secondary px-3 py-2 text-sm"
                    :disabled="!editTagInput.trim()"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <!-- Buttons -->
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  @click="closeEditModal"
                  class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style="border-color: var(--color-border-card)"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-1 btn-success"
                  :disabled="updating"
                >
                  {{ updating ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg w-full max-w-sm p-6">
          <h2 class="text-xl font-bold text-primary-custom mb-4">Delete Recipe?</h2>
          <p class="text-secondary-custom mb-6">
            Are you sure you want to delete "{{ currentRecipe?.title }}"? This action cannot be undone.
          </p>
          <div class="flex gap-3">
            <button
              @click="showDeleteConfirm = false"
              class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              style="border-color: var(--color-border-card)"
            >
              Cancel
            </button>
            <button
              @click="deleteRecipe"
              class="flex-1 btn-warning"
              :disabled="deleting"
            >
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Image Capture Modal -->
      <!-- **Feature: recipe-image-capture** -->
      <image-capture-modal
        :visible="showImageCapture"
        @close="closeImageCapture"
        @image-captured="handleImageCaptured"
        @images-captured="handleImagesCaptured"
        ref="imageCaptureModal"
      ></image-capture-modal>
      
    </div>
  `,
  
  setup() {
    const recipeStore = window.useRecipeStore();
    const shoppingStore = window.useShoppingStore();
    return { recipeStore, shoppingStore };
  },
  
  data() {
    return {
      // URL scraping
      scrapeUrl: '',
      
      // Save options for scraped recipe
      selectedTags: [],
      newTagInput: '',
      saving: false,
      
      // Filters
      filterTag: '',
      
      // Recipe modal
      showRecipeModal: false,
      currentRecipe: null,
      scaleMultiplier: 1,
      
      // Edit modal
      showEditModal: false,
      editForm: {
        title: '',
        servings: 1,
        tags: []
      },
      editTagInput: '',
      updating: false,
      
      // Delete confirmation
      showDeleteConfirm: false,
      deleting: false,
      
      // Ingredient selection for shopping list
      // **Feature: recipe-shopping-integration**
      // **Validates: Requirements 1.2, 1.4**
      selectedIngredients: new Set(),
      sendingToShopping: false,
      
      // Category dropdown state
      // **Feature: multi-image-recipe-categories**
      // **Validates: Requirements 6.3**
      categoryDropdownVisible: false,
      categoryDropdownIndex: -1,
      categoryDropdownStyle: {},
      shoppingCategories: ['General', 'Dairy', 'Bakery', 'Produce', 'Meat', 'Frozen', 'Pantry', 'Household', 'Personal Care'],
      
      // Image capture
      // **Feature: recipe-image-capture**
      // **Validates: Requirements 1.1, 5.2, 5.3, 5.4**
      showImageCapture: false,
      
      // Multi-image viewer state
      // **Feature: multi-image-recipe-categories**
      // **Validates: Requirements 9.2, 9.3**
      currentImageIndex: 0,
      loadingSourceImage: false
    };
  },
  
  computed: {
    recipes() {
      return this.recipeStore.recipes;
    },
    loading() {
      return this.recipeStore.loading;
    },
    error() {
      return this.recipeStore.error;
    },
    scraping() {
      return this.recipeStore.scraping;
    },
    scrapedRecipe() {
      return this.recipeStore.scrapedRecipe;
    },
    scrapeError() {
      return this.recipeStore.scrapeError;
    },
    llmHealth() {
      return this.recipeStore.llmHealth;
    },
    // Image capture computed properties
    // **Feature: recipe-image-capture**
    imageProcessing() {
      return this.recipeStore.imageProcessing || this.recipeStore.imageUploading;
    },
    imageProcessingStatus() {
      return this.recipeStore.imageProcessingStatus;
    },
    imageError() {
      return this.recipeStore.imageError;
    },
    availableTags() {
      return this.recipeStore.allTags;
    },
    suggestedTags() {
      // Use AI-suggested tags if available from scraped recipe
      // **Feature: recipe-image-capture**
      // **Validates: Requirements 11.4**
      if (this.scrapedRecipe?.suggestedTags?.length > 0) {
        return this.scrapedRecipe.suggestedTags.filter(t => !this.selectedTags.includes(t)).slice(0, 3);
      }
      // Fall back to common tags
      const common = ['quick', 'easy', 'vegetarian', 'vegan', 'gluten-free', 'kid-friendly', 'healthy', 'comfort-food'];
      return common.filter(t => !this.selectedTags.includes(t)).slice(0, 5);
    },
    filteredRecipes() {
      let result = this.recipes;
      
      if (this.filterTag) {
        result = result.filter(r => r.tags?.includes(this.filterTag));
      }
      
      return result;
    },
    scaledServings() {
      const originalServings = this.currentRecipe?.servings || 1;
      return originalServings * this.scaleMultiplier;
    },
    scaledIngredients() {
      if (!this.currentRecipe?.ingredients) return [];
      
      return this.currentRecipe.ingredients.map(ing => {
        if (ing.quantity === null || ing.quantity === undefined) {
          return ing;
        }
        return {
          ...ing,
          quantity: Math.round(ing.quantity * this.scaleMultiplier * 100) / 100
        };
      });
    },
    
    // Multi-image viewer computed properties
    // **Feature: multi-image-recipe-categories**
    // **Validates: Requirements 9.2, 9.3**
    hasSourceImages() {
      return this.currentRecipe?.sourceImageKeys?.length > 0 || this.currentRecipe?.sourceImageKey;
    },
    sourceImageCount() {
      if (this.currentRecipe?.sourceImageKeys?.length > 0) {
        return this.currentRecipe.sourceImageKeys.length;
      }
      return this.currentRecipe?.sourceImageKey ? 1 : 0;
    },
    currentSourceImageKey() {
      if (this.currentRecipe?.sourceImageKeys?.length > 0) {
        return this.currentRecipe.sourceImageKeys[this.currentImageIndex];
      }
      return this.currentRecipe?.sourceImageKey || null;
    }
  },
  
  async mounted() {
    await this.loadRecipes();
    await this.recipeStore.loadTags();
    await this.checkLLMHealth();
  },
  
  methods: {
    async loadRecipes() {
      await this.recipeStore.loadRecipes();
    },
    
    async checkLLMHealth() {
      await this.recipeStore.checkLLMHealth();
    },
    
    async handleScrape() {
      if (!this.scrapeUrl) return;
      
      const result = await this.recipeStore.scrapeRecipe(this.scrapeUrl);
      if (result.success) {
        this.scrapeUrl = '';
        // Reset save options
        this.selectedTags = [];
      }
    },
    
    // === Image Capture Methods ===
    // **Feature: recipe-image-capture**
    // **Validates: Requirements 1.1, 5.2, 5.3, 5.4, 8.2, 11.4**
    
    /**
     * Open the image capture modal
     * **Validates: Requirements 1.1**
     */
    openImageCapture() {
      this.showImageCapture = true;
      this.recipeStore.clearImageError();
    },
    
    /**
     * Close the image capture modal
     */
    closeImageCapture() {
      this.showImageCapture = false;
    },
    
    /**
     * Handle captured image from modal
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 6.1, 6.2**
     * @param {Object} imageData - { file, extension, previewUrl }
     */
    async handleImageCaptured(imageData) {
      const modal = this.$refs.imageCaptureModal;
      
      try {
        // Step 1: Get presigned upload URL with retry
        this.recipeStore.setImageUploading(true);
        modal?.setImageUploadProgress(0, 10);
        
        const urlResult = await this.retryWithBackoff(
          () => this.recipeStore.getImageUploadUrl(imageData.extension),
          2, // max retries
          (result) => result.success
        );
        
        if (!urlResult.success) {
          throw new Error(urlResult.error || 'Failed to get upload URL');
        }
        
        modal?.setImageUploadProgress(0, 20);
        
        // Step 2: Upload image directly to S3 with retry
        const uploadResult = await this.retryWithBackoff(
          async () => {
            const response = await fetch(urlResult.uploadUrl, {
              method: 'PUT',
              body: imageData.file,
              headers: {
                'Content-Type': imageData.file.type
              }
            });
            return { ok: response.ok, status: response.status };
          },
          2, // max retries
          (result) => result.ok
        );
        
        if (!uploadResult.ok) {
          throw new Error(`Failed to upload image (status: ${uploadResult.status})`);
        }
        
        modal?.setImageUploadProgress(0, 60);
        this.recipeStore.setImageUploading(false);
        
        // Step 3: Close modal and process image
        this.showImageCapture = false;
        
        // Step 4: Process the uploaded image (no retry - long operation)
        const processResult = await this.recipeStore.processRecipeImage(urlResult.s3Key);
        
        if (!processResult.success) {
          throw new Error(processResult.error || 'Failed to process image');
        }
        
        // Reset save options for the new recipe
        this.selectedTags = [];
        
        // Add suggested tags from the AI if available
        if (processResult.recipe?.suggestedTags) {
          this.selectedTags = [...processResult.recipe.suggestedTags];
        }
        
        console.log('✅ Recipe extracted from image:', processResult.recipe?.title);
        this.showToast('Recipe extracted successfully!', 'success');
      } catch (error) {
        console.error('Image capture error:', error);
        this.recipeStore.setImageUploading(false);
        
        // Set error with retry option in modal
        modal?.setError(error.message, {
          title: 'Upload Failed',
          canRetry: true,
          action: 'confirm'
        });
        
        this.showToast(this.getUserFriendlyError(error.message), 'error');
      }
    },
    
    /**
     * Handle multiple captured images from modal
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 1.6, 8.1, 8.2, 8.3, 8.4**
     * @param {Object} data - { images: Array<{ file, extension, previewUrl }> }
     */
    async handleImagesCaptured(data) {
      const modal = this.$refs.imageCaptureModal;
      const { images } = data;
      
      if (!images || images.length === 0) {
        modal?.setError('No images to upload');
        return;
      }
      
      try {
        this.recipeStore.setImageUploading(true);
        modal?.setUploading(true);
        
        const extensions = images.map(img => img.extension);
        const s3Keys = [];
        
        // Step 1: Get presigned upload URLs for all images
        const urlsResult = await this.retryWithBackoff(
          () => this.recipeStore.getMultipleImageUploadUrls(extensions),
          2,
          (result) => result.success
        );
        
        if (!urlsResult.success) {
          throw new Error(urlsResult.error || 'Failed to get upload URLs');
        }
        
        const uploads = urlsResult.uploads;
        
        // Step 2: Upload each image with progress tracking
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const upload = uploads[i];
          
          modal?.setImageUploadProgress(i, 10);
          
          const uploadResult = await this.retryWithBackoff(
            async () => {
              const response = await fetch(upload.uploadUrl, {
                method: 'PUT',
                body: img.file,
                headers: {
                  'Content-Type': img.file.type
                }
              });
              return { ok: response.ok, status: response.status };
            },
            2,
            (result) => result.ok
          );
          
          if (!uploadResult.ok) {
            modal?.setImageError(i, `Upload failed (status: ${uploadResult.status})`);
            throw new Error(`Failed to upload image ${i + 1}`);
          }
          
          modal?.setImageUploaded(i, upload.s3Key);
          s3Keys.push(upload.s3Key);
        }
        
        this.recipeStore.setImageUploading(false);
        
        // Step 3: Close modal and process images
        this.showImageCapture = false;
        
        // Step 4: Process all uploaded images
        const processResult = await this.recipeStore.processMultipleRecipeImages(s3Keys);
        
        if (!processResult.success) {
          throw new Error(processResult.error || 'Failed to process images');
        }
        
        // Reset save options for the new recipe
        this.selectedTags = [];
        
        // Add suggested tags from the AI if available
        if (processResult.recipe?.suggestedTags) {
          this.selectedTags = [...processResult.recipe.suggestedTags];
        }
        
        console.log('✅ Recipe extracted from', s3Keys.length, 'images:', processResult.recipe?.title);
        this.showToast('Recipe extracted successfully!', 'success');
      } catch (error) {
        console.error('Multi-image capture error:', error);
        this.recipeStore.setImageUploading(false);
        modal?.setUploading(false);
        
        modal?.setError(error.message, {
          title: 'Upload Failed',
          canRetry: true,
          action: 'confirm'
        });
        
        this.showToast(this.getUserFriendlyError(error.message), 'error');
      }
    },
    
    /**
     * Retry an async operation with exponential backoff
     * **Validates: Requirements 6.1, 6.2**
     * @param {Function} operation - Async function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {Function} isSuccess - Function to check if result is successful
     * @returns {Promise<any>} Result of the operation
     */
    async retryWithBackoff(operation, maxRetries, isSuccess) {
      let lastResult;
      let lastError;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          lastResult = await operation();
          if (isSuccess(lastResult)) {
            return lastResult;
          }
        } catch (error) {
          lastError = error;
          console.warn(`Attempt ${attempt + 1} failed:`, error.message);
        }
        
        // Don't wait after the last attempt
        if (attempt < maxRetries) {
          // Exponential backoff: 500ms, 1000ms, 2000ms...
          const delay = Math.min(500 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Return last result or throw last error
      if (lastError) {
        throw lastError;
      }
      return lastResult;
    },
    
    /**
     * Convert technical errors to user-friendly messages
     * **Validates: Requirements 6.1, 6.2**
     * @param {string} error - Technical error message
     * @returns {string} User-friendly error message
     */
    getUserFriendlyError(error) {
      if (!error) return 'An unexpected error occurred';
      
      const errorLower = error.toLowerCase();
      
      // Network errors
      if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('failed to fetch')) {
        return 'Network connection error. Please check your internet connection.';
      }
      
      // Timeout errors
      if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
        return 'The request took too long. Please try again.';
      }
      
      // Service unavailable
      if (errorLower.includes('unavailable') || errorLower.includes('503')) {
        return 'Service temporarily unavailable. Please try again later.';
      }
      
      // Vision/extraction errors
      if (errorLower.includes('could not read recipe') || errorLower.includes('could not extract')) {
        return 'Could not read recipe from image. Please ensure the text is clearly visible.';
      }
      
      // File validation - already user-friendly
      if (errorLower.includes('unsupported') || errorLower.includes('too large')) {
        return error;
      }
      
      return error;
    },
    
    /**
     * View the original source image for a recipe
     * **Validates: Requirements 8.2**
     * @param {Object} recipe - Recipe with sourceImageKey
     */
    async viewSourceImage(recipe) {
      if (!recipe?.sourceImageKey) return;
      
      try {
        const result = await this.recipeStore.getImageViewUrl(recipe.sourceImageKey);
        if (result.success && result.viewUrl) {
          window.open(result.viewUrl, '_blank');
        } else {
          this.showToast('Failed to load original image', 'error');
        }
      } catch (error) {
        console.error('Failed to get image view URL:', error);
        this.showToast('Failed to load original image', 'error');
      }
    },
    
    /**
     * View the current source image in multi-image viewer
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 9.2, 9.3**
     */
    async viewCurrentSourceImage() {
      const imageKey = this.currentSourceImageKey;
      if (!imageKey) return;
      
      this.loadingSourceImage = true;
      try {
        const result = await this.recipeStore.getImageViewUrl(imageKey);
        if (result.success && result.viewUrl) {
          window.open(result.viewUrl, '_blank');
        } else {
          this.showToast('Failed to load original image', 'error');
        }
      } catch (error) {
        console.error('Failed to get image view URL:', error);
        this.showToast('Failed to load original image', 'error');
      } finally {
        this.loadingSourceImage = false;
      }
    },
    
    /**
     * Navigate to previous source image
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 9.2, 9.3**
     */
    prevSourceImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
      }
    },
    
    /**
     * Navigate to next source image
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 9.2, 9.3**
     */
    nextSourceImage() {
      if (this.currentImageIndex < this.sourceImageCount - 1) {
        this.currentImageIndex++;
      }
    },
    
    /**
     * Go to a specific source image by index
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 9.2, 9.3**
     * @param {number} index - Image index to navigate to
     */
    goToSourceImage(index) {
      if (index >= 0 && index < this.sourceImageCount) {
        this.currentImageIndex = index;
      }
    },
    
    clearScrapedRecipe() {
      this.recipeStore.clearScrapedRecipe();
      this.selectedTags = [];
      this.newTagInput = '';
    },
    
    formatIngredient(ing) {
      if (!ing) return '';
      const parts = [];
      if (ing.quantity !== null && ing.quantity !== undefined) {
        parts.push(ing.quantity);
      }
      if (ing.unit) {
        parts.push(ing.unit);
      }
      if (ing.name) {
        parts.push(ing.name);
      }
      if (ing.notes) {
        parts.push(`(${ing.notes})`);
      }
      return parts.join(' ');
    },
    
    addTag() {
      const tag = this.newTagInput.trim().toLowerCase();
      if (tag && !this.selectedTags.includes(tag)) {
        this.selectedTags.push(tag);
      }
      this.newTagInput = '';
    },
    
    addSuggestedTag(tag) {
      if (!this.selectedTags.includes(tag)) {
        this.selectedTags.push(tag);
      }
    },
    
    removeTag(tag) {
      this.selectedTags = this.selectedTags.filter(t => t !== tag);
    },
    
    async saveScrapedRecipe() {
      if (!this.scrapedRecipe) return;
      
      this.saving = true;
      try {
        const recipeData = {
          ...this.scrapedRecipe,
          tags: this.selectedTags
        };
        
        const result = await this.recipeStore.saveRecipe(recipeData);
        if (result.success) {
          this.clearScrapedRecipe();
          // Reload to get fresh data
          await this.loadRecipes();
        }
      } finally {
        this.saving = false;
      }
    },
    
    clearFilters() {
      this.filterTag = '';
    },
    
    openRecipeModal(recipe) {
      this.currentRecipe = recipe;
      this.scaleMultiplier = 1;
      this.currentImageIndex = 0; // Reset image index for multi-image viewer
      this.showRecipeModal = true;
    },
    
    closeRecipeModal() {
      this.showRecipeModal = false;
      this.currentRecipe = null;
      this.scaleMultiplier = 1;
      this.currentImageIndex = 0; // Reset image index
    },
    
    increaseScale() {
      this.scaleMultiplier++;
    },
    
    decreaseScale() {
      if (this.scaleMultiplier > 1) {
        this.scaleMultiplier--;
      }
    },
    
    openEditModal() {
      if (!this.currentRecipe) return;
      
      this.editForm = {
        title: this.currentRecipe.title,
        servings: this.currentRecipe.servings || 1,
        tags: [...(this.currentRecipe.tags || [])]
      };
      this.editTagInput = '';
      this.showEditModal = true;
    },
    
    closeEditModal() {
      this.showEditModal = false;
      this.editForm = { title: '', servings: 1, tags: [] };
      this.editTagInput = '';
    },
    
    addEditTag() {
      const tag = this.editTagInput.trim().toLowerCase();
      if (tag && !this.editForm.tags.includes(tag)) {
        this.editForm.tags.push(tag);
      }
      this.editTagInput = '';
    },
    
    removeEditTag(tag) {
      this.editForm.tags = this.editForm.tags.filter(t => t !== tag);
    },
    
    async saveEditedRecipe() {
      if (!this.currentRecipe) return;
      
      this.updating = true;
      try {
        const result = await this.recipeStore.updateRecipe(this.currentRecipe.id, {
          title: this.editForm.title,
          servings: this.editForm.servings,
          tags: this.editForm.tags
        });
        
        if (result.success) {
          // Update current recipe with new values
          this.currentRecipe = { ...this.currentRecipe, ...this.editForm };
          this.closeEditModal();
          await this.recipeStore.loadTags(); // Refresh tags
        }
      } finally {
        this.updating = false;
      }
    },
    
    confirmDeleteRecipe() {
      this.showDeleteConfirm = true;
    },
    
    async deleteRecipe() {
      if (!this.currentRecipe) return;
      
      this.deleting = true;
      try {
        const result = await this.recipeStore.deleteRecipe(this.currentRecipe.id);
        if (result.success) {
          this.showDeleteConfirm = false;
          this.closeRecipeModal();
        }
      } finally {
        this.deleting = false;
      }
    },
    
    // Ingredient Selection Methods
    // **Feature: recipe-shopping-integration**
    // **Validates: Requirements 1.3, 2.2, 2.3, 2.4**
    
    /**
     * Toggles the selection state of a single ingredient
     * **Validates: Requirements 2.2**
     * @param {number} index - The index of the ingredient to toggle
     */
    toggleIngredient(index) {
      // Create a new Set to trigger Vue reactivity
      const newSet = new Set(this.selectedIngredients);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      this.selectedIngredients = newSet;
    },
    
    /**
     * Opens the category dropdown for an ingredient
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 6.3**
     * @param {number} index - The index of the ingredient
     * @param {Event} event - The click event
     */
    openCategoryDropdown(index, event) {
      const rect = event.target.getBoundingClientRect();
      this.categoryDropdownIndex = index;
      this.categoryDropdownStyle = {
        top: `${rect.bottom + 4}px`,
        left: `${Math.min(rect.left, window.innerWidth - 160)}px`
      };
      this.categoryDropdownVisible = true;
      
      // Close dropdown when clicking outside
      const closeHandler = (e) => {
        if (!e.target.closest('.category-dropdown')) {
          this.closeCategoryDropdown();
          document.removeEventListener('click', closeHandler);
        }
      };
      setTimeout(() => document.addEventListener('click', closeHandler), 0);
    },
    
    /**
     * Closes the category dropdown
     * **Feature: multi-image-recipe-categories**
     */
    closeCategoryDropdown() {
      this.categoryDropdownVisible = false;
      this.categoryDropdownIndex = -1;
    },
    
    /**
     * Selects a category for the current ingredient
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 6.3**
     * @param {string} category - The selected category
     */
    selectCategory(category) {
      if (this.categoryDropdownIndex >= 0 && this.currentRecipe?.ingredients) {
        // Update the ingredient's category
        this.currentRecipe.ingredients[this.categoryDropdownIndex].category = category;
      }
      this.closeCategoryDropdown();
    },
    
    /**
     * Gets the badge style for a category
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 6.2**
     * @param {string} category - The category name
     * @returns {Object} Style object with backgroundColor and color
     */
    getCategoryBadgeStyle(category) {
      const colors = this.getCategoryColors(category);
      return {
        backgroundColor: colors.background,
        color: 'white',
        borderColor: colors.border
      };
    },
    
    /**
     * Gets the color scheme for a category (matches shopping page)
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 6.2**
     * @param {string} category - The category name
     * @returns {Object} Color scheme with background, border, accent
     */
    getCategoryColors(category) {
      const colorSchemes = {
        'Produce': {
          background: '#22c55e', // green-500
          border: '#16a34a',     // green-600
          accent: '#15803d'      // green-700
        },
        'Dairy': {
          background: '#3b82f6', // blue-500
          border: '#2563eb',    // blue-600
          accent: '#1d4ed8'     // blue-700
        },
        'Meat': {
          background: '#ef4444', // red-500
          border: '#dc2626',    // red-600
          accent: '#b91c1c'     // red-700
        },
        'Bakery': {
          background: '#f59e0b', // amber-500
          border: '#d97706',    // amber-600
          accent: '#b45309'     // amber-700
        },
        'Frozen': {
          background: '#8b5cf6', // violet-500
          border: '#7c3aed',    // violet-600
          accent: '#6d28d9'     // violet-700
        },
        'Pantry': {
          background: '#cd853f', // peru-600 (medium brown/tan)
          border: '#b8860b',    // darkgoldenrod (darker brown)
          accent: '#8b4513'     // saddlebrown (dark brown)
        },
        'Household': {
          background: '#9ca3af', // gray-400 (lighter gray)
          border: '#6b7280',    // gray-500 (medium gray)
          accent: '#4b5563'     // gray-600 (darker gray)
        },
        'Personal Care': {
          background: '#ec4899', // pink-500
          border: '#db2777',    // pink-600
          accent: '#be185d'     // pink-700
        },
        'General': {
          background: 'var(--color-primary-500)',
          border: 'var(--color-primary-600)',
          accent: 'var(--color-primary-700, #1f2937)'
        }
      };

      return colorSchemes[category] || colorSchemes['General'];
    },
    
    /**
     * Adds a single ingredient to the shopping cart
     * @param {number} index - The index of the ingredient to add
     */
    async addSingleIngredientToCart(index) {
      if (index >= this.scaledIngredients.length) return;
      
      const ingredient = this.scaledIngredients[index];
      const includeQty = this.ingredientQtySettings[index] !== false;
      
      const shoppingItem = window.formatIngredientForShopping(ingredient, includeQty);
      
      if (!shoppingItem.name) {
        this.showToast('Invalid ingredient', 'error');
        return;
      }
      
      try {
        // Use Pinia store - single source of truth
        const result = await this.shoppingStore.addItem(shoppingItem);
        
        if (result.success) {
          if (result.offline) {
            this.showToast(`${shoppingItem.name} added - will sync when online`, 'info');
          } else {
            this.showToast(`${shoppingItem.name} added to cart`, 'success');
          }
        } else {
          this.showToast('Failed to add item', 'error');
        }
      } catch (error) {
        console.error('Failed to add ingredient:', error);
        this.showToast(`Failed: ${error.message}`, 'error');
      }
    },
    
    /**
     * Selects all ingredients
     * **Validates: Requirements 2.3**
     */
    selectAllIngredients() {
      const newSet = new Set();
      for (let i = 0; i < this.scaledIngredients.length; i++) {
        newSet.add(i);
      }
      this.selectedIngredients = newSet;
    },
    
    /**
     * Deselects all ingredients
     * **Validates: Requirements 2.4**
     */
    deselectAllIngredients() {
      this.selectedIngredients = new Set();
    },
    
    /**
     * Adds a single ingredient to the shopping list
     * @param {number} index - The index of the ingredient to add
     */
    async addSingleIngredientToShopping(index) {
      if (index >= this.scaledIngredients.length) return;
      
      const ingredient = this.scaledIngredients[index];
      const shoppingItem = window.formatIngredientForShopping(ingredient, true);
      
      if (!shoppingItem.name) {
        this.showToast('Could not add ingredient', 'error');
        return;
      }
      
      try {
        const result = await this.shoppingStore.addItem(shoppingItem);
        if (result.success) {
          if (result.offline) {
            this.showToast('Added - will sync when online', 'info');
          } else {
            this.showToast('Added to shopping list', 'success');
          }
        } else {
          this.showToast('Failed to add ingredient', 'error');
        }
      } catch (error) {
        console.error('Failed to add ingredient:', error);
        this.showToast('Failed to add ingredient', 'error');
      }
    },
    
    /**
     * Sends selected ingredients to the shopping list
     * Uses per-ingredient qty settings via Pinia store (single source of truth)
     * **Feature: recipe-shopping-integration**
     * **Validates: Requirements 2.5, 3.1, 3.2, 3.3, 3.4**
     */
    async sendSelectedToShoppingList() {
      if (this.selectedIngredients.size === 0) {
        this.showToast('Please select at least one ingredient', 'warning');
        return;
      }
      
      this.sendingToShopping = true;
      
      try {
        const selectedCount = this.selectedIngredients.size;
        let successCount = 0;
        let offlineCount = 0;
        let errorCount = 0;
        
        // Add each selected ingredient to shopping list via Pinia store
        for (const index of this.selectedIngredients) {
          if (index >= this.scaledIngredients.length) continue;
          
          const ingredient = this.scaledIngredients[index];
          // Always include quantity when sending to shopping list
          const shoppingItem = window.formatIngredientForShopping(ingredient, true);
          
          if (!shoppingItem.name) {
            errorCount++;
            continue;
          }
          
          try {
            const result = await this.shoppingStore.addItem(shoppingItem);
            if (result.success) {
              successCount++;
              if (result.offline) {
                offlineCount++;
              }
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error('Failed to add ingredient to shopping list:', error);
            errorCount++;
          }
        }
        
        // Show appropriate toast notification
        if (errorCount === selectedCount) {
          // All failed
          this.showToast('Failed to add ingredients to shopping list', 'error');
        } else if (offlineCount > 0 && offlineCount === successCount) {
          // All offline
          this.showToast(`${successCount} item${successCount !== 1 ? 's' : ''} added - will sync when online`, 'info');
        } else if (errorCount > 0) {
          // Partial success
          this.showToast(`Added ${successCount} of ${selectedCount} items (${errorCount} failed)`, 'warning');
        } else {
          // All succeeded
          this.showToast(`${successCount} item${successCount !== 1 ? 's' : ''} added to shopping list`, 'success');
        }
        
        // Clear selection after successful add
        this.selectedIngredients = new Set();
      } catch (error) {
        console.error('Error sending to shopping list:', error);
        this.showToast(`Failed to add items: ${error.message}`, 'error');
      } finally {
        this.sendingToShopping = false;
      }
    },
    
    /**
     * Shows a toast notification
     * **Feature: recipe-shopping-integration**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
     * @param {string} message - The message to display
     * @param {string} type - The type of toast: 'success', 'error', 'warning', 'info'
     */
    showToast(message, type = 'info') {
      // Create toast element
      const toast = document.createElement('div');
      toast.className = `fixed bottom-20 sm:bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-[100] transition-all duration-300 flex items-center gap-2`;
      
      // Set colors based on type
      const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white'
      };
      toast.className += ` ${colors[type] || colors.info}`;
      
      // Set icon based on type
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };
      
      toast.innerHTML = `
        <span class="font-bold">${icons[type] || icons.info}</span>
        <span>${message}</span>
      `;
      
      // Add to DOM
      document.body.appendChild(toast);
      
      // Animate in
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
      });
      
      // Remove after delay
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 3000);
    }
  }
});

// Register component globally
window.RecipePageComponent = RecipePage;
