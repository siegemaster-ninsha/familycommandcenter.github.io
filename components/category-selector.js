// Category Selector Component
// Dropdown with all categories plus "Uncategorized" option
// Includes inline "Add new category" option
// **Feature: quicklist-categories**
// **Validates: Requirements 2.1, 4.1, 4.2**

const CategorySelector = Vue.defineComponent({
  name: 'CategorySelector',
  template: `
    <div class="category-selector">
      <label v-if="label" class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">{{ label }}</label>
      
      <!-- Category Dropdown -->
      <div class="relative" v-if="!showInlineAdd">
        <select
          :value="modelValue"
          @change="onCategoryChange"
          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none pr-10"
          style="border-color: var(--color-border-card); background: var(--color-surface-2); color: var(--color-text-primary);"
        >
          <option value="">Uncategorized</option>
          <option 
            v-for="category in sortedCategories" 
            :key="category.id" 
            :value="category.id"
          >
            {{ category.name }}
          </option>
          <option value="__add_new__" class="text-primary-600 font-medium">+ Add new category...</option>
        </select>
        <!-- Dropdown arrow icon -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <div v-html="getIcon('chevronDown', 16)" style="color: var(--color-text-secondary);"></div>
        </div>
      </div>
      
      <!-- Inline Add Category Form -->
      <div v-else class="space-y-2">
        <div class="flex gap-2">
          <input
            ref="newCategoryInput"
            v-model="newCategoryName"
            type="text"
            maxlength="50"
            class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            style="border-color: var(--color-border-card); background: var(--color-surface-2); color: var(--color-text-primary);"
            placeholder="New category name"
            @keyup.enter="createCategory"
            @keyup.escape="cancelInlineAdd"
          />
          <button
            @click="createCategory"
            :disabled="!newCategoryName.trim() || creating"
            class="px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style="background: var(--color-primary-500); color: white;"
            title="Create category"
          >
            <div v-if="creating" class="animate-spin" v-html="getIcon('loader', 16)"></div>
            <div v-else v-html="getIcon('check', 16)"></div>
          </button>
          <button
            @click="cancelInlineAdd"
            class="px-3 py-2 rounded-lg transition-colors"
            style="background: var(--color-neutral-100); color: var(--color-neutral-600);"
            title="Cancel"
          >
            <div v-html="getIcon('x', 16)"></div>
          </button>
        </div>
        <!-- Validation error -->
        <p v-if="inlineError" class="text-xs" style="color: var(--color-error-600);">{{ inlineError }}</p>
        <p class="text-xs text-secondary-custom">Max 50 characters. Press Enter to create, Escape to cancel.</p>
      </div>
    </div>
  `,
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: 'Category'
    },
    categories: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'category-created'],
  data() {
    return {
      showInlineAdd: false,
      newCategoryName: '',
      inlineError: null,
      creating: false
    };
  },
  computed: {
    // Sort categories alphabetically, excluding Uncategorized (handled separately)
    sortedCategories() {
      return [...(this.categories || [])]
        .filter(c => c && c.name && c.name !== 'Uncategorized')
        .sort((a, b) => {
          // Sort by sortOrder first, then by name
          const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
          if (orderDiff !== 0) return orderDiff;
          return a.name.localeCompare(b.name);
        });
    }
  },
  methods: {
    getIcon(name, size) {
      const Helpers = window.Helpers;
      if (Helpers?.IconLibrary?.getIcon) {
        return Helpers.IconLibrary.getIcon(name, 'lucide', size, 'currentColor');
      }
      return '';
    },
    
    onCategoryChange(event) {
      const value = event.target.value;
      
      if (value === '__add_new__') {
        // Show inline add form
        this.showInlineAdd = true;
        this.newCategoryName = '';
        this.inlineError = null;
        this.$nextTick(() => {
          this.$refs.newCategoryInput?.focus();
        });
      } else {
        this.$emit('update:modelValue', value);
      }
    },
    
    async createCategory() {
      const name = this.newCategoryName.trim();
      
      // Client-side validation
      if (!name) {
        this.inlineError = 'Category name is required';
        return;
      }
      if (name.length > 50) {
        this.inlineError = 'Category name must be 50 characters or less';
        return;
      }
      
      // Check for duplicate (case-insensitive)
      const existingNames = (this.categories || []).map(c => (c.name || '').toLowerCase());
      if (existingNames.includes(name.toLowerCase())) {
        this.inlineError = 'Category name already exists';
        return;
      }
      
      this.creating = true;
      this.inlineError = null;
      
      try {
        // Use categories store to create
        const categoriesStore = window.useCategoriesStore?.();
        if (!categoriesStore) {
          throw new Error('Categories store not available');
        }
        
        const result = await categoriesStore.createCategory(name);
        
        if (result.success && result.category) {
          // Emit the new category ID as the selected value
          this.$emit('update:modelValue', result.category.id);
          this.$emit('category-created', result.category);
          
          // Reset and close inline form
          this.showInlineAdd = false;
          this.newCategoryName = '';
        } else {
          this.inlineError = result.error || 'Failed to create category';
        }
      } catch (error) {
        console.error('Failed to create category:', error);
        this.inlineError = error.message || 'Failed to create category';
      } finally {
        this.creating = false;
      }
    },
    
    cancelInlineAdd() {
      this.showInlineAdd = false;
      this.newCategoryName = '';
      this.inlineError = null;
    }
  }
});

// Export component for manual registration
window.CategorySelectorComponent = CategorySelector;
