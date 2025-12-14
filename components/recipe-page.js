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
                :disabled="scraping"
                required
              >
              <button
                type="submit"
                class="btn-primary flex items-center justify-center gap-2 px-6 py-3 min-w-[140px]"
                :disabled="scraping || !scrapeUrl"
              >
                <div v-if="scraping" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <div v-else v-html="Helpers.IconLibrary.getIcon('download', 'lucide', 18, 'text-white')"></div>
                <span>{{ scraping ? 'Scraping...' : 'Scrape Recipe' }}</span>
              </button>
            </div>
          </form>
          
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
              
              <!-- Category Selection -->
              <div class="mb-3">
                <label class="block text-sm font-medium mb-1">Categories</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="cat in availableCategories"
                    :key="cat"
                    @click="toggleCategory(cat)"
                    class="px-3 py-1 rounded-full text-sm transition-colors"
                    :class="selectedCategories.includes(cat) 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                  >
                    {{ cat }}
                  </button>
                  <button
                    @click="showNewCategoryInput = true"
                    v-if="!showNewCategoryInput"
                    class="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"
                  >
                    <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 14, '')"></div>
                    New
                  </button>
                  <div v-if="showNewCategoryInput" class="flex items-center gap-2">
                    <input
                      v-model="newCategoryName"
                      type="text"
                      placeholder="Category name"
                      class="px-3 py-1 border rounded-lg text-sm"
                      style="border-color: var(--color-border-card)"
                      @keyup.enter="addNewCategory"
                    >
                    <button @click="addNewCategory" class="text-green-600 hover:text-green-700">
                      <div v-html="Helpers.IconLibrary.getIcon('check', 'lucide', 16, '')"></div>
                    </button>
                    <button @click="showNewCategoryInput = false; newCategoryName = ''" class="text-red-600 hover:text-red-700">
                      <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 16, '')"></div>
                    </button>
                  </div>
                </div>
              </div>
              
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
                <div v-if="suggestedTags.length > 0" class="mt-2">
                  <span class="text-xs text-secondary-custom">Suggestions: </span>
                  <button
                    v-for="tag in suggestedTags"
                    :key="tag"
                    @click="addSuggestedTag(tag)"
                    class="text-xs text-primary-500 hover:underline mr-2"
                  >
                    {{ tag }}
                  </button>
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
          
          <!-- Filters -->
          <div class="flex flex-wrap gap-3 mb-4">
            <!-- Category Filter -->
            <div class="flex-1 min-w-[150px]">
              <select
                v-model="filterCategory"
                class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                style="border-color: var(--color-border-card)"
              >
                <option value="">All Categories</option>
                <option v-for="cat in availableCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            
            <!-- Tag Filter -->
            <div class="flex-1 min-w-[150px]">
              <select
                v-model="filterTag"
                class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                style="border-color: var(--color-border-card)"
              >
                <option value="">All Tags</option>
                <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
              </select>
            </div>
            
            <!-- Clear Filters -->
            <button
              v-if="filterCategory || filterTag"
              @click="clearFilters"
              class="px-4 py-2 text-sm text-secondary-custom hover:text-primary-custom transition-colors flex items-center gap-1"
            >
              <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 14, '')"></div>
              Clear Filters
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
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="recipe in filteredRecipes"
              :key="recipe.id"
              @click="openRecipeModal(recipe)"
              class="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md"
              style="background-color: var(--color-bg-primary); border-color: var(--color-border-card);"
            >
              <h3 class="font-semibold text-primary-custom mb-2 line-clamp-2">{{ recipe.title }}</h3>
              <div class="flex flex-wrap gap-1 mb-2">
                <span
                  v-for="cat in recipe.categories?.slice(0, 2)"
                  :key="cat"
                  class="px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-700"
                >
                  {{ cat }}
                </span>
                <span v-if="recipe.categories?.length > 2" class="text-xs text-secondary-custom">
                  +{{ recipe.categories.length - 2 }}
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
            <!-- Serving Size Selector -->
            <div class="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
              <label class="font-medium">Servings:</label>
              <div class="flex items-center gap-2">
                <button
                  @click="decreaseServings"
                  class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                  :disabled="scaledServings <= 1"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('minus', 'lucide', 16, '')"></div>
                </button>
                <span class="w-12 text-center font-bold text-lg">{{ scaledServings }}</span>
                <button
                  @click="increaseServings"
                  class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, '')"></div>
                </button>
              </div>
              <span class="text-sm text-secondary-custom">
                (Original: {{ currentRecipe?.servings || 'N/A' }})
              </span>
            </div>
            
            <!-- Categories & Tags -->
            <div class="flex flex-wrap gap-2">
              <span
                v-for="cat in currentRecipe?.categories"
                :key="'cat-' + cat"
                class="px-3 py-1 rounded-full text-sm bg-primary-500 text-white"
              >
                {{ cat }}
              </span>
              <span
                v-for="tag in currentRecipe?.tags"
                :key="'tag-' + tag"
                class="px-3 py-1 rounded-full text-sm bg-secondary-500 text-white"
              >
                {{ tag }}
              </span>
            </div>
            
            <!-- Ingredients -->
            <div>
              <h3 class="text-lg font-bold text-primary-custom mb-3 flex items-center gap-2">
                <div v-html="Helpers.IconLibrary.getIcon('list', 'lucide', 18, '')"></div>
                Ingredients
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="(ing, idx) in scaledIngredients"
                  :key="idx"
                  class="flex items-start gap-2 p-2 rounded hover:bg-gray-50"
                >
                  <input type="checkbox" class="mt-1 w-4 h-4 rounded">
                  <span>{{ formatIngredient(ing) }}</span>
                </li>
              </ul>
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
          </div>
          
          <!-- Modal Footer -->
          <div class="sticky bottom-0 bg-white border-t p-4 flex justify-between" style="border-color: var(--color-border-card);">
            <button
              @click="confirmDeleteRecipe"
              class="btn-warning flex items-center gap-2 px-4 py-2"
            >
              <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 16, 'text-white')"></div>
              Delete
            </button>
            <div class="flex gap-2">
              <button
                @click="openEditModal"
                class="btn-secondary flex items-center gap-2 px-4 py-2"
              >
                <div v-html="Helpers.IconLibrary.getIcon('edit', 'lucide', 16, '')"></div>
                Edit
              </button>
              <button
                @click="closeRecipeModal"
                class="btn-primary px-6 py-2"
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
              
              <!-- Categories -->
              <div>
                <label class="block text-sm font-medium mb-1">Categories</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="cat in availableCategories"
                    :key="cat"
                    type="button"
                    @click="toggleEditCategory(cat)"
                    class="px-3 py-1 rounded-full text-sm transition-colors"
                    :class="editForm.categories.includes(cat) 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                  >
                    {{ cat }}
                  </button>
                </div>
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
    </div>
  `,
  
  setup() {
    const recipeStore = useRecipeStore();
    return { recipeStore };
  },
  
  data() {
    return {
      // URL scraping
      scrapeUrl: '',
      
      // Save options for scraped recipe
      selectedCategories: [],
      selectedTags: [],
      newTagInput: '',
      showNewCategoryInput: false,
      newCategoryName: '',
      saving: false,
      
      // Filters
      filterCategory: '',
      filterTag: '',
      
      // Recipe modal
      showRecipeModal: false,
      currentRecipe: null,
      scaledServings: 1,
      
      // Edit modal
      showEditModal: false,
      editForm: {
        title: '',
        servings: 1,
        categories: [],
        tags: []
      },
      editTagInput: '',
      updating: false,
      
      // Delete confirmation
      showDeleteConfirm: false,
      deleting: false
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
    availableCategories() {
      return this.recipeStore.categories.length > 0 
        ? this.recipeStore.categories 
        : ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Appetizer'];
    },
    availableTags() {
      return this.recipeStore.allTags;
    },
    suggestedTags() {
      // Filter out already selected tags
      const common = ['quick', 'easy', 'vegetarian', 'vegan', 'gluten-free', 'kid-friendly', 'healthy', 'comfort-food'];
      return common.filter(t => !this.selectedTags.includes(t)).slice(0, 5);
    },
    filteredRecipes() {
      let result = this.recipes;
      
      if (this.filterCategory) {
        result = result.filter(r => r.categories?.includes(this.filterCategory));
      }
      
      if (this.filterTag) {
        result = result.filter(r => r.tags?.includes(this.filterTag));
      }
      
      return result;
    },
    scaledIngredients() {
      if (!this.currentRecipe?.ingredients) return [];
      
      const originalServings = this.currentRecipe.servings || 1;
      const scaleFactor = this.scaledServings / originalServings;
      
      return this.currentRecipe.ingredients.map(ing => {
        if (ing.quantity === null || ing.quantity === undefined) {
          return ing;
        }
        return {
          ...ing,
          quantity: Math.round(ing.quantity * scaleFactor * 100) / 100
        };
      });
    }
  },
  
  async mounted() {
    await this.loadRecipes();
    await this.recipeStore.loadCategories();
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
        this.selectedCategories = [];
        this.selectedTags = [];
      }
    },
    
    clearScrapedRecipe() {
      this.recipeStore.clearScrapedRecipe();
      this.selectedCategories = [];
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
    
    toggleCategory(cat) {
      const idx = this.selectedCategories.indexOf(cat);
      if (idx === -1) {
        this.selectedCategories.push(cat);
      } else {
        this.selectedCategories.splice(idx, 1);
      }
    },
    
    async addNewCategory() {
      if (!this.newCategoryName.trim()) return;
      
      const name = this.newCategoryName.trim();
      await this.recipeStore.createCategory(name);
      this.selectedCategories.push(name);
      this.newCategoryName = '';
      this.showNewCategoryInput = false;
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
          categories: this.selectedCategories,
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
      this.filterCategory = '';
      this.filterTag = '';
    },
    
    openRecipeModal(recipe) {
      this.currentRecipe = recipe;
      this.scaledServings = recipe.servings || 1;
      this.showRecipeModal = true;
    },
    
    closeRecipeModal() {
      this.showRecipeModal = false;
      this.currentRecipe = null;
      this.scaledServings = 1;
    },
    
    increaseServings() {
      this.scaledServings++;
    },
    
    decreaseServings() {
      if (this.scaledServings > 1) {
        this.scaledServings--;
      }
    },
    
    openEditModal() {
      if (!this.currentRecipe) return;
      
      this.editForm = {
        title: this.currentRecipe.title,
        servings: this.currentRecipe.servings || 1,
        categories: [...(this.currentRecipe.categories || [])],
        tags: [...(this.currentRecipe.tags || [])]
      };
      this.editTagInput = '';
      this.showEditModal = true;
    },
    
    closeEditModal() {
      this.showEditModal = false;
      this.editForm = { title: '', servings: 1, categories: [], tags: [] };
      this.editTagInput = '';
    },
    
    toggleEditCategory(cat) {
      const idx = this.editForm.categories.indexOf(cat);
      if (idx === -1) {
        this.editForm.categories.push(cat);
      } else {
        this.editForm.categories.splice(idx, 1);
      }
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
          categories: this.editForm.categories,
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
    }
  }
});

// Register component globally
window.RecipePageComponent = RecipePage;
