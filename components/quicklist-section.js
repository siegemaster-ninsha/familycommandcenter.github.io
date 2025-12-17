// Quicklist Section Component with Category Accordions
// **Feature: quicklist-categories**
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.4**
// **Feature: weekly-chore-scheduling**
// **Validates: Requirements 1.1, 4.1, 4.2, 4.3**

const QuicklistSection = Vue.defineComponent({
  name: 'QuicklistSection',
  template: `
    <div class="w-full">
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-gray-900 text-2xl font-bold leading-tight flex items-center gap-2">
            <div v-html="getIcon('zap', 20)" style="color: var(--color-primary-500);"></div>
            Quicklist
          </h2>
          <!-- Manage Categories button -->
          <button
            @click="$emit('manage-categories')"
            class="flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors"
            style="color: var(--color-primary-600); background: var(--color-primary-50);"
            title="Manage Categories"
          >
            <div v-html="getIcon('settings', 16)"></div>
            <span class="hidden sm:inline">Categories</span>
          </button>
        </div>
        
        <!-- Search Input - Requirements 6.1 -->
        <div class="mb-4">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div v-html="getIcon('search', 18)" style="color: var(--color-neutral-400);"></div>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search quicklist chores..."
              class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              style="border-color: var(--color-neutral-200); background: var(--color-bg-card);"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              title="Clear search"
            >
              <div v-html="getIcon('x', 18)" style="color: var(--color-neutral-400);"></div>
            </button>
          </div>
        </div>
        
        <p class="text-gray-600 text-sm mb-4 text-center">Tap these common chores to assign them quickly</p>

        <!-- Loading state -->
        <div v-if="loading" class="space-y-3">
          <sl-skeleton v-for="n in 3" :key="'ql-skel-'+n" effect="pulse" class="skeleton-card"></sl-skeleton>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="text-center py-12">
          <div v-html="getIcon('alertTriangle', 48)" class="mx-auto mb-3" style="color: var(--color-error-500);"></div>
          <p class="font-medium text-red-700">Error loading quicklist</p>
          <p class="text-sm mt-1 text-red-600">{{ error }}</p>
          <button
            @click="$emit('retry')"
            class="mt-3 px-4 py-2 text-white rounded-lg transition-colors"
            style="background-color: var(--color-primary-500);"
          >
            Try Again
          </button>
        </div>

        <!-- Empty state when no chores at all -->
        <div v-else-if="totalChoreCount === 0" class="text-center py-8 text-gray-500">
          <div v-html="getIcon('inbox', 48)" class="mx-auto mb-3" style="color: var(--color-neutral-400);"></div>
          <p>No quicklist chores yet.</p>
          <p class="text-sm mt-1">Add common chores for quick assignment!</p>
        </div>

        <!-- No search results - Requirements 6.4 -->
        <div v-else-if="filteredChoreCount === 0 && searchQuery.trim()" class="text-center py-8 text-gray-500">
          <div v-html="getIcon('searchX', 48)" class="mx-auto mb-3" style="color: var(--color-neutral-400);"></div>
          <p>No matching chores</p>
          <p class="text-sm mt-1">Try a different search term</p>
        </div>

        <!-- Category Accordions - Requirements 3.1, 3.2, 3.3, 3.4, 3.5 -->
        <div v-else class="space-y-2 mb-6">
          <sl-details
            v-for="categoryName in sortedCategoryNames"
            :key="categoryName"
            :summary="getCategorySummary(categoryName)"
            :open="isExpanded(categoryName)"
            @sl-show="onCategoryExpand(categoryName)"
            @sl-hide="onCategoryCollapse(categoryName)"
            class="quicklist-accordion"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
              <!-- Use sl-card to match other chore cards -->
              <sl-card
                v-for="chore in getChoresForCategory(categoryName)"
                :key="chore.id"
                class="chore-card"
                :class="selectedChoreId === chore.id ? 'chore-card--selected' : ''"
                @click="$emit('chore-click', chore)"
              >
                <div class="chore-card-content">
                  <!-- Chore name - full width on top -->
                  <span class="chore-name">{{ chore.name }}</span>

                  <!-- Actions row: badge + buttons -->
                  <div class="chore-card-actions">
                    <!-- Pay amount -->
                    <sl-badge v-if="chore.amount > 0" variant="primary" pill class="chore-amount">
                      \${{ chore.amount.toFixed(2) }}
                    </sl-badge>

                    <!-- Spacer to push buttons right -->
                    <span style="flex: 1;"></span>

                    <!-- Schedule button - Requirements 1.1, 4.1, 4.2, 4.3 -->
                    <button
                      @click.stop="$emit('open-schedule', chore)"
                      class="chore-schedule-btn"
                      title="Schedule this chore"
                    >
                      <div v-html="getIcon('calendar', 16)"></div>
                      <sl-badge 
                        v-if="getScheduleCount(chore) > 0" 
                        variant="primary" 
                        pill 
                        class="schedule-badge"
                      >
                        {{ getScheduleCount(chore) }}
                      </sl-badge>
                    </button>

                    <!-- Assign Category dropdown - only for Uncategorized chores -->
                    <!-- Wrapper div stops all event propagation to prevent accordion toggle -->
                    <div 
                      v-if="isUncategorized(chore)" 
                      @click.stop 
                      @touchstart.stop
                      @touchend.stop
                      class="dropdown-wrapper"
                    >
                      <sl-dropdown 
                        :hoist="true" 
                        placement="bottom-start"
                      >
                        <button
                          slot="trigger"
                          class="chore-category-btn"
                          title="Assign category"
                        >
                          <div v-html="getIcon('folderPlus', 16)"></div>
                        </button>
                        <sl-menu @sl-select="(e) => onCategorySelect(chore, e)">
                          <sl-menu-item
                            v-for="cat in categories"
                            :key="cat.id"
                            :value="cat.id"
                          >
                            {{ cat.name }}
                          </sl-menu-item>
                        </sl-menu>
                      </sl-dropdown>
                    </div>

                    <!-- Delete button -->
                    <button
                      @click.stop="$emit('delete-chore', chore.id)"
                      class="chore-delete-btn"
                      title="Remove from quicklist"
                    >
                      <div v-html="getIcon('trash', 18)"></div>
                    </button>
                  </div>
                </div>
              </sl-card>
            </div>
          </sl-details>
        </div>

        <!-- Add to Quicklist button -->
        <div class="flex items-center justify-center">
          <button
            @click="$emit('add-chore')"
            class="flex items-center gap-2 px-6 py-4 text-white rounded-xl transition-colors min-h-[48px] w-full sm:w-auto justify-center font-medium"
            style="background-color: var(--color-primary-500);"
            title="Add new chore to quicklist"
          >
            <div v-html="getIcon('plus', 16)"></div>
            <span>Add to Quicklist</span>
          </button>
        </div>
      </div>
    </div>
  `,
  props: {
    quicklistChores: {
      type: Array,
      default: () => []
    },
    categories: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    },
    selectedChoreId: {
      type: String,
      default: null
    }
  },
  emits: ['chore-click', 'delete-chore', 'add-chore', 'retry', 'manage-categories', 'category-changed', 'open-schedule'],
  data() {
    return {
      searchQuery: '',
      expandedCategories: new Set()
    };
  },

  computed: {
    /**
     * Groups quicklist items by category, filtered by search query
     * **Feature: quicklist-categories**
     * **Validates: Requirements 3.1, 6.1, 6.2**
     */
    groupedChores() {
      const query = (this.searchQuery || '').trim().toLowerCase();
      
      // Filter chores by search query
      let filtered = this.quicklistChores || [];
      if (query) {
        filtered = filtered.filter(chore => {
          const name = (chore.name || '').toLowerCase();
          return name.includes(query);
        });
      }
      
      // Group by category
      const grouped = Object.create(null);
      
      // Initialize groups for each category
      (this.categories || []).forEach(cat => {
        if (cat && cat.name) {
          grouped[cat.name] = [];
        }
      });
      
      // Always have Uncategorized group
      grouped['Uncategorized'] = [];
      
      // Assign chores to groups
      filtered.forEach(chore => {
        const categoryName = chore.categoryName || 'Uncategorized';
        if (Object.hasOwn(grouped, categoryName)) {
          grouped[categoryName].push(chore);
        } else {
          grouped['Uncategorized'].push(chore);
        }
      });
      
      return grouped;
    },
    
    /**
     * Returns sorted category names with Uncategorized always last
     * **Feature: quicklist-categories**
     * **Validates: Requirements 3.5**
     */
    sortedCategoryNames() {
      const grouped = this.groupedChores;
      const categories = this.categories || [];
      
      // Build a map of category name to sortOrder
      const categoryOrder = new Map();
      categories.forEach((cat, idx) => {
        if (cat && cat.name) {
          categoryOrder.set(cat.name, cat.sortOrder ?? idx);
        }
      });
      
      // Get keys that have chores (non-empty groups)
      const keys = Object.keys(grouped).filter(key => grouped[key].length > 0);
      
      return keys.sort((a, b) => {
        // Uncategorized always last
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        
        // Then by sortOrder from categories
        const orderA = categoryOrder.get(a) ?? Infinity;
        const orderB = categoryOrder.get(b) ?? Infinity;
        return orderA - orderB;
      });
    },
    
    /**
     * Total count of all quicklist chores
     */
    totalChoreCount() {
      return (this.quicklistChores || []).length;
    },
    
    /**
     * Count of chores after filtering
     */
    filteredChoreCount() {
      return Object.values(this.groupedChores).reduce((sum, arr) => sum + arr.length, 0);
    }
  },
  
  watch: {
    // Auto-expand categories when search is active
    searchQuery(newVal) {
      if (newVal && newVal.trim()) {
        // Expand all categories with matching results
        this.sortedCategoryNames.forEach(name => {
          this.expandedCategories.add(name);
        });
      }
    }
  },
  
  mounted() {
    // Expand all categories by default for better UX
    this.sortedCategoryNames.forEach(name => {
      this.expandedCategories.add(name);
    });
  },
  
  methods: {
    getIcon(name, size) {
      const Helpers = window.Helpers;
      if (Helpers?.IconLibrary?.getIcon) {
        return Helpers.IconLibrary.getIcon(name, 'lucide', size, 'currentColor');
      }
      return '';
    },
    
    /**
     * Check if a chore is uncategorized
     */
    isUncategorized(chore) {
      return !chore.categoryName || chore.categoryName === 'Uncategorized';
    },
    
    /**
     * Get the schedule count for a quicklist chore
     * Returns the total number of member-day combinations
     * **Feature: weekly-chore-scheduling**
     * **Validates: Requirements 1.1, 4.2**
     */
    getScheduleCount(chore) {
      if (!chore || !chore.schedule) {
        return 0;
      }
      return Object.values(chore.schedule)
        .reduce((sum, days) => sum + (Array.isArray(days) ? days.length : 0), 0);
    },
    
    /**
     * Handle category selection from dropdown
     * Stops propagation to prevent accordion toggle
     */
    onCategorySelect(chore, event) {
      // Stop propagation to prevent accordion from toggling
      if (event) {
        event.stopPropagation();
        event.preventDefault?.();
      }
      
      const categoryId = event.detail?.item?.value;
      if (categoryId) {
        const category = (this.categories || []).find(c => c.id === categoryId);
        if (category) {
          this.$emit('category-changed', { chore, categoryId, categoryName: category.name });
        }
      }
    },
    
    /**
     * Get chores for a specific category, sorted alphabetically by name
     */
    getChoresForCategory(categoryName) {
      const chores = this.groupedChores[categoryName] || [];
      return [...chores].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    },
    
    /**
     * Get summary text for accordion header (category name + count)
     * **Validates: Requirements 3.2**
     */
    getCategorySummary(categoryName) {
      const count = this.getChoresForCategory(categoryName).length;
      return `${categoryName} (${count})`;
    },
    
    /**
     * Check if a category accordion is expanded
     */
    isExpanded(categoryName) {
      return this.expandedCategories.has(categoryName);
    },
    
    /**
     * Handle accordion expand event
     * **Validates: Requirements 3.3**
     */
    onCategoryExpand(categoryName) {
      this.expandedCategories.add(categoryName);
    },
    
    /**
     * Handle accordion collapse event
     * **Validates: Requirements 3.4**
     */
    onCategoryCollapse(categoryName) {
      this.expandedCategories.delete(categoryName);
    }
  }
});

// Export component for manual registration
window.QuicklistSectionComponent = QuicklistSection;
