// Category Management Modal Component
// Modal to list, add, rename, and delete categories
// **Feature: quicklist-categories, app-js-cleanup**
// **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
// _Requirements: 6.1, 6.4_

const CategoryManagementModal = Vue.defineComponent({
  name: 'CategoryManagementModal',
  
  setup() {
    // Use stores directly instead of inject
    // **Feature: app-js-cleanup**
    // _Requirements: 6.1, 6.4_
    const categoriesStore = window.useCategoriesStore?.();
    const choresStore = window.useChoresStore?.();
    const uiStore = window.useUIStore?.();
    
    return {
      categoriesStore,
      choresStore,
      uiStore
    };
  },
  
  template: `
    <flyout-panel
      :open="open"
      @close="$emit('close')"
      title="Manage Categories"
      :show-footer="false"
      :show-header-close="true"
      width="400px"
    >
      <template #default>
        <div class="space-y-4">
          <!-- Add New Category Section -->
          <div class="pb-4 border-b" style="border-color: var(--color-border-card);">
            <label class="block text-sm font-medium text-primary-custom mb-2">Add New Category</label>
            <div class="flex gap-2">
              <input
                ref="newCategoryInput"
                v-model="newCategoryName"
                type="text"
                maxlength="50"
                class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                style="border-color: var(--color-border-card)"
                placeholder="Category name"
                @keyup.enter="createCategory"
              />
              <button
                @click="createCategory"
                :disabled="!newCategoryName.trim() || creating"
                class="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style="background: var(--color-primary-500); color: white;"
              >
                <div v-if="creating" class="animate-spin" v-html="getIcon('loader', 16)"></div>
                <div v-else v-html="getIcon('plus', 16)"></div>
                <span>Add</span>
              </button>
            </div>
            <p v-if="createError" class="text-xs mt-1" style="color: var(--color-error-600);">{{ createError }}</p>
          </div>
          
          <!-- Categories List -->
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-2">
              Your Categories ({{ categories.length }})
            </label>
            
            <!-- Loading state -->
            <div v-if="loading" class="py-8 text-center">
              <div class="animate-spin mx-auto mb-2" v-html="getIcon('loader', 24)" style="color: var(--color-primary-500);"></div>
              <p class="text-sm text-secondary-custom">Loading categories...</p>
            </div>
            
            <!-- Empty state -->
            <div v-else-if="categories.length === 0" class="py-8 text-center">
              <div class="mx-auto mb-2" v-html="getIcon('folder', 32)" style="color: var(--color-neutral-400);"></div>
              <p class="text-sm text-secondary-custom">No categories yet</p>
              <p class="text-xs text-secondary-custom mt-1">Add your first category above</p>
            </div>
            
            <!-- Categories list -->
            <div v-else class="space-y-2 max-h-[400px] overflow-y-auto">
              <div
                v-for="category in sortedCategories"
                :key="category.id"
                class="flex items-center gap-2 p-3 rounded-lg border transition-colors"
                :style="{ borderColor: 'var(--color-border-card)', background: editingId === category.id ? 'var(--color-primary-50)' : 'var(--color-bg-card)' }"
              >
                <!-- Edit mode -->
                <template v-if="editingId === category.id">
                  <input
                    ref="editInput"
                    v-model="editingName"
                    type="text"
                    maxlength="50"
                    class="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    style="border-color: var(--color-primary-300);"
                    @keyup.enter="saveEdit"
                    @keyup.escape="cancelEdit"
                  />
                  <button
                    @click="saveEdit"
                    :disabled="!editingName.trim() || saving"
                    class="p-1.5 rounded transition-colors disabled:opacity-50"
                    style="background: var(--color-success-100); color: var(--color-success-700);"
                    title="Save"
                  >
                    <div v-if="saving" class="animate-spin" v-html="getIcon('loader', 16)"></div>
                    <div v-else v-html="getIcon('check', 16)"></div>
                  </button>
                  <button
                    @click="cancelEdit"
                    class="p-1.5 rounded transition-colors"
                    style="background: var(--color-neutral-100); color: var(--color-neutral-600);"
                    title="Cancel"
                  >
                    <div v-html="getIcon('x', 16)"></div>
                  </button>
                </template>
                
                <!-- View mode -->
                <template v-else>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-primary-custom truncate">{{ category.name }}</p>
                    <p class="text-xs text-secondary-custom">{{ getCategoryItemCount(category.id) }} chores</p>
                  </div>
                  <button
                    @click="startEdit(category)"
                    class="p-1.5 rounded transition-colors hover:bg-gray-100"
                    style="color: var(--color-neutral-500);"
                    title="Rename"
                  >
                    <div v-html="getIcon('pencil', 16)"></div>
                  </button>
                  <button
                    @click="confirmDelete(category)"
                    class="p-1.5 rounded transition-colors hover:bg-red-50"
                    style="color: var(--color-error-500);"
                    title="Delete"
                  >
                    <div v-html="getIcon('trash', 16)"></div>
                  </button>
                </template>
              </div>
            </div>
            
            <!-- Edit error -->
            <p v-if="editError" class="text-xs mt-2" style="color: var(--color-error-600);">{{ editError }}</p>
          </div>
          
          <!-- Delete Confirmation -->
          <div v-if="deletingCategory" class="p-4 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
            <div class="flex items-start gap-3">
              <div v-html="getIcon('alertTriangle', 20)" style="color: var(--color-error-600); flex-shrink: 0; margin-top: 2px;"></div>
              <div class="flex-1">
                <p class="font-medium" style="color: var(--color-error-700);">Delete "{{ deletingCategory.name }}"?</p>
                <p class="text-sm mt-1" style="color: var(--color-error-600);">
                  {{ getCategoryItemCount(deletingCategory.id) }} chores will be moved to Uncategorized.
                </p>
                <div class="flex gap-2 mt-3">
                  <button
                    @click="executeDelete"
                    :disabled="deleting"
                    class="px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                    style="background: var(--color-error-600); color: white;"
                  >
                    <div v-if="deleting" class="animate-spin" v-html="getIcon('loader', 14)"></div>
                    Delete
                  </button>
                  <button
                    @click="cancelDelete"
                    class="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    style="background: var(--color-neutral-100); color: var(--color-neutral-700);"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </flyout-panel>
  `,
  props: {
    open: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  data() {
    return {
      newCategoryName: '',
      creating: false,
      createError: null,
      editingId: null,
      editingName: '',
      saving: false,
      editError: null,
      deletingCategory: null,
      deleting: false
    };
  },
  computed: {
    categories() {
      return this.categoriesStore?.categories || [];
    },
    loading() {
      return this.categoriesStore?.loading || false;
    },
    sortedCategories() {
      return [...this.categories]
        .filter(c => c && c.name)
        .sort((a, b) => {
          const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
          if (orderDiff !== 0) return orderDiff;
          return a.name.localeCompare(b.name);
        });
    },
    quicklistChores() {
      return this.choresStore?.quicklistChores || [];
    }
  },
  watch: {
    open(isOpen) {
      if (isOpen) {
        // Reset state when modal opens
        this.newCategoryName = '';
        this.createError = null;
        this.editingId = null;
        this.editingName = '';
        this.editError = null;
        this.deletingCategory = null;
        
        // Focus the input
        this.$nextTick(() => {
          this.$refs.newCategoryInput?.focus();
        });
      }
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
    
    getCategoryItemCount(categoryId) {
      return this.quicklistChores.filter(c => c.categoryId === categoryId).length;
    },
    
    async createCategory() {
      const name = this.newCategoryName.trim();
      if (!name) {
        this.createError = 'Category name is required';
        return;
      }
      
      this.creating = true;
      this.createError = null;
      
      try {
        const result = await this.categoriesStore.createCategory(name);
        
        if (result.success) {
          this.newCategoryName = '';
        } else {
          this.createError = result.error || 'Failed to create category';
        }
      } catch (error) {
        console.error('Failed to create category:', error);
        this.createError = error.message || 'Failed to create category';
      } finally {
        this.creating = false;
      }
    },
    
    startEdit(category) {
      this.editingId = category.id;
      this.editingName = category.name;
      this.editError = null;
      this.$nextTick(() => {
        const input = this.$refs.editInput;
        if (Array.isArray(input)) {
          input[0]?.focus();
          input[0]?.select();
        } else {
          input?.focus();
          input?.select();
        }
      });
    },
    
    cancelEdit() {
      this.editingId = null;
      this.editingName = '';
      this.editError = null;
    },
    
    async saveEdit() {
      const name = this.editingName.trim();
      if (!name) {
        this.editError = 'Category name is required';
        return;
      }
      
      this.saving = true;
      this.editError = null;
      
      try {
        const result = await this.categoriesStore.updateCategory(this.editingId, name);
        
        if (result.success) {
          this.editingId = null;
          this.editingName = '';
        } else {
          this.editError = result.error || 'Failed to rename category';
        }
      } catch (error) {
        console.error('Failed to rename category:', error);
        this.editError = error.message || 'Failed to rename category';
      } finally {
        this.saving = false;
      }
    },
    
    confirmDelete(category) {
      this.deletingCategory = category;
    },
    
    cancelDelete() {
      this.deletingCategory = null;
    },
    
    async executeDelete() {
      if (!this.deletingCategory) return;
      
      this.deleting = true;
      
      try {
        const result = await this.categoriesStore.deleteCategory(this.deletingCategory.id);
        
        if (result.success) {
          this.deletingCategory = null;
        } else {
          console.error('Failed to delete category:', result.error);
        }
      } catch (error) {
        console.error('Failed to delete category:', error);
      } finally {
        this.deleting = false;
      }
    }
  }
});

// Export component for manual registration
window.CategoryManagementModalComponent = CategoryManagementModal;
