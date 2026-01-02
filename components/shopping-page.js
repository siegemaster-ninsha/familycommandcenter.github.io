// Shopping Page Component
const ShoppingPage = Vue.defineComponent({
  name: 'ShoppingPage',
  template: `
    <div class="space-y-6 pb-24 sm:pb-0">
      <!-- Shopping List -->
      <div class="w-full">
        <div class="w-full block rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <!-- Header with title and buttons -->
          <div class="mb-6 sm:mb-8">
            <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2 mb-4">
              <div v-html="Helpers.IconLibrary.getIcon('lock', 'lucide', 20, 'text-primary-custom')"></div>
              Shopping List
            </h2>
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-2">
                <button
                  @click="showAddItemModal = true"
                  class="hidden sm:flex items-center gap-2 btn-primary touch-target"
                  :disabled="loading"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white')"></div>
                  Add Item
                </button>
            </div>
          </div>
        </div>
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <div class="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary-500 border-t-transparent"></div>
          <p class="text-secondary-custom mt-2">Loading shopping items...</p>
        </div>
        
        <!-- Error state -->
          <div v-else-if="error" class="text-center py-8" style="color: var(--color-error-700);">
            <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 48, '')" style="color: var(--color-error-700);" class="mx-auto mb-3"></div>
            <p class="font-medium">Error loading shopping items</p>
            <p class="text-sm mt-1">{{ error }}</p>
          <button 
            @click="loadShoppingItems"
            class="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
        
        <!-- Shopping items - By Category view -->
        <div v-else class="space-y-3">
          <!-- Global actions header -->
          <div class="flex items-center justify-between border-b pb-2 mb-4" style="border-color: var(--color-border-card);">
            <h3 class="text-lg font-bold text-primary-custom">Shopping List</h3>
            <div class="flex items-center gap-3">
              <span class="text-sm font-normal text-secondary-custom">({{ shoppingItems.length }} items)</span>
              <button
                @click="clearCompleted"
                class="flex items-center gap-2 btn-warning text-sm touch-target"
                :disabled="completedItems === 0 || actionLoading"
                :class="completedItems === 0 || actionLoading ? 'opacity-50 cursor-not-allowed' : ''"
              >
                <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14, 'text-white drop-shadow-sm')"></div>
                Clear Completed
              </button>
            </div>
          </div>

          <!-- Category sections -->
          <div v-for="category in categorySections" :key="category.name" class="space-y-2">
            <!-- Category header -->
            <div class="flex items-center justify-between border-b pb-2" style="border-color: var(--color-border-card);">
              <h4 class="text-base font-semibold text-primary-custom">{{ category.name }}</h4>
              <div class="flex items-center gap-2">
                <span class="text-xs font-normal text-secondary-custom">
                  ({{ category.completedCount }}/{{ category.totalCount }} completed)
                </span>
                <span class="text-xs font-medium text-secondary-custom">
                  {{ Math.round((category.completedCount / category.totalCount) * 100) || 0 }}%
                </span>
              </div>
            </div>

            <!-- Category items -->
            <TransitionGroup name="shopping-item" tag="div" class="shopping-items-container">
              <div
                v-for="item in category.items"
                :key="item.id"
                class="shopping-item flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer"
                :class="[
                  item.isToggling ? 'opacity-75 pointer-events-none' : '',
                  item.completed ? 'opacity-75' : ''
                ]"
                :style="{
                  backgroundColor: getCategoryColors(item.category).background,
                  borderColor: getCategoryColors(item.category).border
                }"
                @click="handleToggleItem(item.id)"
              >
                <div class="relative flex-shrink-0">
                  <div
                    v-if="item.isToggling"
                    class="w-6 h-6 flex items-center justify-center"
                  >
                    <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div
                    v-else
                    v-html="Helpers.IconLibrary.getIcon(item.completed ? 'squareCheck' : 'square', 'lucide', 22, 'text-white')"
                    class="cursor-pointer checkbox-icon"
                    :class="item.completed ? 'checkbox-checked' : ''"
                  ></div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      :class="[
                        'font-medium text-base sm:text-sm',
                        item.completed ? 'line-through text-white opacity-60' : 'text-white'
                      ]"
                    >
                      {{ item.name }}
                    </span>
                    <span v-if="item.quantity" class="text-xs text-white text-opacity-80">
                      ({{ item.quantity }})
                    </span>
                    <span v-if="item.store" class="inline-flex items-center gap-1 text-xs bg-white bg-opacity-20 px-1.5 py-0.5 rounded">
                      <div v-html="Helpers.IconLibrary.getIcon('home', 'lucide', 10, '')"></div>
                      {{ item.store }}
                    </span>
                  </div>
                  <div v-if="item.notes" class="text-xs text-white text-opacity-75 truncate">
                    {{ item.notes }}
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    @click.stop="startEditItem(item)"
                    class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 rounded"
                    style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 32px; height: 32px;"
                    :class="'hover:scale-105 active:scale-95'"
                    title="Edit item"
                  >
                    <div v-html="Helpers.IconLibrary.getIcon('edit', 'lucide', 16, 'text-white drop-shadow-sm')"></div>
                  </button>
                  <button
                    @click.stop="removeItem(item.id)"
                    class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 rounded"
                    style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 32px; height: 32px;"
                    :class="'hover:scale-105 active:scale-95'"
                    title="Remove item"
                  >
                    <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14, 'text-white drop-shadow-sm')"></div>
                  </button>
                </div>
              </div>
            </TransitionGroup>

            <!-- Show message if category is empty -->
            <div v-if="category.items.length === 0" class="text-center py-4 text-secondary-custom text-sm">
              No items in {{ category.name }}
            </div>
          </div>

          <!-- Show message if no items at all -->
          <div v-if="shoppingItems.length === 0" class="text-center py-8 text-secondary-custom">
            <div v-html="Helpers.IconLibrary.getIcon('shoppingCart', 'lucide', 48, 'mx-auto mb-3 opacity-50')" class="mx-auto mb-3 opacity-50"></div>
            <p>Your shopping list is empty.</p>
            <p class="text-sm mt-1">Click "Add Item" to get started or use the quick list below!</p>
          </div>
        </div>
      </div>

      <!-- Quick List Accordion (Requirements 5.1, 5.2, 4.1) -->
      <div class="rounded-lg border" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <!-- Accordion Header - Always visible -->
        <div 
          class="flex items-center justify-between p-6 cursor-pointer select-none"
          @click="toggleQuicklistAccordion"
        >
          <div class="flex items-center gap-2">
            <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
              <div v-html="Helpers.IconLibrary.getIcon('zap', 'lucide', 20, 'text-primary-custom')"></div>
              Quick List
            </h2>
            <span class="text-sm font-normal text-secondary-custom">({{ sortedQuickItems.length }} items)</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click.stop="showAddQuickItemModal = true"
              class="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm"
              :disabled="quickLoading"
            >
              <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 14, 'text-white')"></div>
              Add Quick Item
            </button>
            <!-- Expand/Collapse Icon -->
            <div 
              class="transition-transform duration-200"
              :class="quicklistExpanded ? 'rotate-180' : 'rotate-0'"
              v-html="Helpers.IconLibrary.getIcon('chevronDown', 'lucide', 20, 'text-secondary-custom')"
            ></div>
          </div>
        </div>
        
        <!-- Accordion Content - Collapsible -->
        <div v-show="quicklistExpanded" class="px-6 pb-6">
          <!-- Search Input (Requirements 4.1, 4.2) -->
          <div class="relative mb-4">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div v-html="Helpers.IconLibrary.getIcon('search', 'lucide', 16, 'text-secondary-custom opacity-60')"></div>
            </div>
            <input
              v-model="quicklistSearch"
              type="text"
              placeholder="Search quick items..."
              class="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              style="border-color: var(--color-border-card); background-color: var(--color-bg-card);"
            >
            <!-- Clear button -->
            <button
              v-if="quicklistSearch"
              @click="clearQuicklistSearch"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              title="Clear search"
            >
              <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 16, 'text-secondary-custom hover:text-primary-custom')"></div>
            </button>
          </div>
          
          <p class="text-sm text-secondary-custom mb-4">Tap any item below to quickly add it to your shopping list!</p>
          
          <!-- Quick loading state -->
          <div v-if="quickLoading" class="text-center py-4">
            <div class="spinner-border animate-spin inline-block w-6 h-6 border-4 rounded-full" style="border-color: var(--color-primary-500); border-top-color: transparent;"></div>
            <p class="text-secondary-custom mt-2 text-sm">Loading quick items...</p>
          </div>
          
          <!-- Quick error state -->
          <div v-else-if="quickError" class="text-center py-4" style="color: var(--color-error-700);">
            <p class="text-sm">{{ quickError }}</p>
            <button 
              @click="loadQuickItems"
              class="mt-2 px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
          </div>
          
          <!-- Quick items list - now uses filteredQuickItems -->
          <div v-else class="space-y-1">
            <div
              v-for="quickItem in filteredQuickItems"
              :key="quickItem.id"
              class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              :style="{
                backgroundColor: getCategoryColors(quickItem.category).background,
                borderColor: getCategoryColors(quickItem.category).border
              }"
              @click="addQuickItemToList(quickItem.id)"
            >
              <!-- Quick add icon -->
              <div class="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <div v-html="Helpers.IconLibrary.getIcon('plusCircle', 'lucide', 18, 'text-white opacity-70')"></div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-base sm:text-sm text-white">
                    {{ quickItem.name }}
                  </span>
                  <span v-if="quickItem.defaultQuantity" class="text-xs text-white text-opacity-80">
                    ({{ quickItem.defaultQuantity }})
                  </span>
                  <span class="text-xs text-white text-opacity-70">
                    {{ quickItem.category }}
                  </span>
                  <span v-if="quickItem.defaultStore" class="inline-flex items-center gap-1 text-xs bg-white bg-opacity-20 px-1.5 py-0.5 rounded">
                    <div v-html="Helpers.IconLibrary.getIcon('home', 'lucide', 10, '')"></div>
                    {{ quickItem.defaultStore }}
                  </span>
                </div>
                <div v-if="quickItem.defaultNotes" class="text-xs text-white text-opacity-75 truncate">
                  {{ quickItem.defaultNotes }}
                </div>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  @click.stop="startEditQuickItem(quickItem)"
                  class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 rounded"
                  style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 32px; height: 32px;"
                  :class="'hover:scale-105 active:scale-95'"
                  title="Edit quick item"
                  :disabled="quickActionLoading"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('edit', 'lucide', 16, 'text-white drop-shadow-sm')"></div>
                </button>
                <button
                  @click.stop="removeQuickItem(quickItem.id)"
                  class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 rounded"
                  style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 32px; height: 32px;"
                  :class="'hover:scale-105 active:scale-95'"
                  title="Remove quick item"
                  :disabled="quickActionLoading"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14, 'text-white drop-shadow-sm')"></div>
                </button>
              </div>
            </div>
            
            <!-- No matches found message (Requirements 4.5) -->
            <div v-if="filteredQuickItems.length === 0 && quicklistSearch && sortedQuickItems.length > 0" class="text-center py-4 sm:py-8 text-secondary-custom">
              <div v-html="Helpers.IconLibrary.getIcon('search', 'lucide', 32, 'mx-auto mb-2 opacity-50')" class="mx-auto mb-2 opacity-50"></div>
              <p>No matches found</p>
              <p class="text-sm mt-1">Try a different search term</p>
              <button 
                @click="clearQuicklistSearch"
                class="mt-2 px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition-colors"
              >
                Clear Search
              </button>
            </div>
            
            <!-- Empty quicklist message -->
            <div v-if="sortedQuickItems.length === 0" class="text-center py-4 sm:py-8 text-secondary-custom">
              <div v-html="Helpers.IconLibrary.getIcon('minus', 'lucide', 32, 'mx-auto mb-2 opacity-50')" class="mx-auto mb-2 opacity-50"></div>
              <p>No quick items available.</p>
              <p class="text-sm mt-1">Click "Add Quick Item" to create some common items!</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="hidden sm:block rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4 flex items-center gap-2">
          <div v-html="Helpers.IconLibrary.getIcon('zap', 'lucide', 20, 'text-primary-custom')"></div>
          Quick Actions
        </h2>
        
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <button
            @click="markAllComplete"
            class="flex items-center justify-center gap-2 btn-success touch-target"
            :disabled="pendingItems === 0 || actionLoading"
            :class="pendingItems === 0 || actionLoading ? 'opacity-50 cursor-not-allowed' : ''"
          >
            <div v-html="Helpers.IconLibrary.getIcon('checkCircle', 'lucide', 16, 'text-white')"></div>
            Mark All Complete
          </button>
          
          <button
            @click="clearAll"
            class="flex items-center justify-center gap-2 btn-primary touch-target"
            :disabled="shoppingItems.length === 0 || actionLoading"
            :class="shoppingItems.length === 0 || actionLoading ? 'opacity-50 cursor-not-allowed' : ''"
          >
            <div v-html="Helpers.IconLibrary.getIcon('minus', 'lucide', 16, 'text-white')"></div>
            Clear All
          </button>
        </div>
      </div>

    </div>

      <!-- Add/Edit Item Modal -->
      <div v-if="showAddItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">

          <form @submit.prevent="saveItem">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Item Name *</label>
                <input
                  :value="editMode ? editingItem.name : newItem.name"
                  @input="editMode ? (editingItem.name = $event.target.value) : (newItem.name = $event.target.value)"
                  type="text"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                  placeholder="Enter item name"
                  required
                >
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Category</label>
                <select
                  :value="editMode ? editingItem.category : newItem.category"
                  @change="editMode ? (editingItem.category = $event.target.value) : (newItem.category = $event.target.value)"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                >
                  <option value="General">General</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Produce">Produce</option>
                  <option value="Meat">Meat</option>
                  <option value="Frozen">Frozen</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Household">Household</option>
                  <option value="Personal Care">Personal Care</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Store</label>
                <select
                  :value="editMode ? editingItem.store : newItem.store"
                  @change="editMode ? (editingItem.store = $event.target.value) : (newItem.store = $event.target.value)"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                >
                  <option value="">No Store Selected</option>
                  <option v-for="store in stores" :key="store.id" :value="store.name">{{ store.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Quantity</label>
                <input
                  :value="editMode ? editingItem.quantity : newItem.quantity"
                  @input="editMode ? (editingItem.quantity = $event.target.value) : (newItem.quantity = $event.target.value)"
                  type="text"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                  placeholder="e.g., 2 lbs, 1 gallon"
                >
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Notes</label>
                <input
                  :value="editMode ? editingItem.notes : newItem.notes"
                  @input="editMode ? (editingItem.notes = $event.target.value) : (newItem.notes = $event.target.value)"
                  type="text"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                  placeholder="Any special notes"
                >
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                type="button"
                @click="cancelEdit"
                class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                style="border-color: var(--color-border-card)"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 btn-success"
                :disabled="(editMode ? !editingItem.name : !newItem.name) || actionLoading"
              >
                {{ editMode ? 'Update Item' : 'Add Item' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add/Edit Quick Item Modal -->
      <div v-if="showAddQuickItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">

          <form @submit.prevent="saveQuickItem">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Item Name *</label>
                <input
                  :value="editMode ? editingQuickItem.name : newQuickItem.name"
                  @input="editMode ? (editingQuickItem.name = $event.target.value) : (newQuickItem.name = $event.target.value)"
                  type="text"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                  placeholder="Enter item name"
                  required
                >
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Category</label>
                <select
                  :value="editMode ? editingQuickItem.category : newQuickItem.category"
                  @change="editMode ? (editingQuickItem.category = $event.target.value) : (newQuickItem.category = $event.target.value)"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                >
                  <option value="General">General</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Produce">Produce</option>
                  <option value="Meat">Meat</option>
                  <option value="Frozen">Frozen</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Household">Household</option>
                  <option value="Personal Care">Personal Care</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Default Quantity</label>
                <input
                  :value="editMode ? editingQuickItem.defaultQuantity : newQuickItem.defaultQuantity"
                  @input="editMode ? (editingQuickItem.defaultQuantity = $event.target.value) : (newQuickItem.defaultQuantity = $event.target.value)"
                  type="text"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                  placeholder="e.g., 2 lbs, 1 gallon"
                >
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Default Notes</label>
                <input
                  :value="editMode ? editingQuickItem.defaultNotes : newQuickItem.defaultNotes"
                  @input="editMode ? (editingQuickItem.defaultNotes = $event.target.value) : (newQuickItem.defaultNotes = $event.target.value)"
                  type="text"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                  placeholder="Any default notes"
                >
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Default Store</label>
                <select
                  :value="editMode ? editingQuickItem.defaultStore : newQuickItem.defaultStore"
                  @change="editMode ? (editingQuickItem.defaultStore = $event.target.value) : (newQuickItem.defaultStore = $event.target.value)"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                >
                  <option value="">No Store Selected</option>
                  <option v-for="store in stores" :key="store.id" :value="store.name">
                    {{ store.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                type="button"
                @click="cancelEdit"
                class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                style="border-color: var(--color-border-card)"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                :disabled="(editMode ? !editingQuickItem.name : !newQuickItem.name) || quickActionLoading"
              >
                {{ editMode ? 'Update Quick Item' : 'Add Quick Item' }}
              </button>
            </div>
          </form>
        </div>
      </div>



      <!-- Success Message -->
      <div v-if="showSuccess" class="fixed top-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-[100]" style="background: var(--color-success-600);">
        {{ successMessage }}
      </div>

      <!-- Error Message -->
      <div v-if="showError" class="fixed top-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-[100]" style="background: var(--color-error-600);">
        {{ errorMessage }}
      </div>

      <!-- Mobile Floating Add Button (FAB) -->
      <button
        class="fab-add-item sm:hidden"
        @click="showAddItemModal = true"
        :disabled="loading"
        aria-label="Add item"
        title="Add item"
      >
        <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 24, '')"></div>
      </button>
    </div>
  `,
  setup() {
    // Use Pinia store as single source of truth for shopping data
    const shoppingStore = window.useShoppingStore();
    return { shoppingStore };
  },
  data() {
    return {
      // Note: shoppingItems, quickItems, and stores now come from Pinia store via setup()
      localLoading: false,
      quickLoading: false,
      storeLoading: false,
      storeExpandedMobile: false,
      actionLoading: false,
      quickActionLoading: false,
      error: null,
      quickError: null,
      // Quicklist accordion and search state (Requirements 5.1, 4.1)
      quicklistExpanded: true,
      quicklistSearch: '',
      showAddItemModal: false,
      showAddQuickItemModal: false,
      showAddStoreModal: false,
      showSuccess: false,
      successMessage: '',
      showError: false,
      errorMessage: '',
      newItem: {
        name: '',
        category: 'General',
        quantity: '',
        notes: '',
        store: ''
      },
      newQuickItem: {
        name: '',
        category: 'General',
        defaultQuantity: '',
        defaultNotes: '',
        defaultStore: ''
      },
      newStore: {
        name: ''
      },
      showEditItemModal: false,
      showEditQuickItemModal: false,
      editingItem: null, // The shopping item being edited
      editingQuickItem: null, // The quicklist item being edited
      editMode: false // true for edit, false for add
    };
  },
  computed: {
    // Access store data via computed properties for reactivity
    shoppingItems() {
      return this.shoppingStore.items;
    },
    shoppingQuickItems() {
      return this.shoppingStore.quickItems;
    },
    stores() {
      return this.shoppingStore.stores;
    },
    
    completedItems() {
      return this.shoppingItems.filter(item => item.completed).length;
    },
    
    pendingItems() {
      return this.shoppingItems.filter(item => !item.completed).length;
    },
    
    completionPercentage() {
      return this.shoppingItems.length > 0 ? Math.round((this.completedItems / this.shoppingItems.length) * 100) : 0;
    },

    
    // Use store data with fallback names for template compatibility
    quickItems() {
      return this.shoppingQuickItems;
    },

    sortedQuickItems() {
      // Sort quick items by category using the same logical grocery store order, then alphabetically
      return [...this.quickItems].sort((a, b) => {
        // First sort by category using a logical grocery store order
        const categoryOrder = this.getCategoryOrder;
        const aOrder = categoryOrder[a.category] || 999;
        const bOrder = categoryOrder[b.category] || 999;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        // Finally sort by name alphabetically
        return a.name.localeCompare(b.name);
      });
    },

    // Filtered quick items using fuzzy search (Requirements 4.3, 4.4)
    filteredQuickItems() {
      if (!this.quicklistSearch || this.quicklistSearch.trim() === '') {
        return this.sortedQuickItems;
      }
      // Use fuzzyMatch function - imported at top of file or available globally
      const fuzzyMatch = window.fuzzyMatch || ((query, name) => {
        if (!query || query.trim() === '') return true;
        if (!name) return false;
        const normalizedQuery = query.toLowerCase().trim();
        const normalizedName = name.toLowerCase();
        let queryIndex = 0;
        for (let i = 0; i < normalizedName.length && queryIndex < normalizedQuery.length; i++) {
          if (normalizedName[i] === normalizedQuery[queryIndex]) {
            queryIndex++;
          }
        }
        return queryIndex === normalizedQuery.length;
      });
      return this.sortedQuickItems.filter(item => fuzzyMatch(this.quicklistSearch, item.name));
    },

    categorySections() {
      // Group items by category and sort categories
      const grouped = {};

      this.shoppingItems.forEach(item => {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push(item);
      });

      // Sort items within each category (completed to bottom, then alphabetically)
      Object.keys(grouped).forEach(category => {
        const beforeSort = grouped[category].map(i => `${i.name}(${i.completed ? '✓' : '○'})`).join(', ');
        grouped[category].sort((a, b) => {
          // First, completed items go to bottom
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          // Then sort alphabetically by name
          return a.name.localeCompare(b.name);
        });
        const afterSort = grouped[category].map(i => `${i.name}(${i.completed ? '✓' : '○'})`).join(', ');
        if (beforeSort !== afterSort) {
          console.log(`[SORT] ${category} reordered:`, { before: beforeSort, after: afterSort });
        }
      });

      // Convert to array and sort categories by logical grocery store order
      const categoryOrder = this.getCategoryOrder;
      return Object.keys(grouped)
        .map(categoryName => ({
          name: categoryName,
          items: grouped[categoryName],
          totalCount: grouped[categoryName].length,
          completedCount: grouped[categoryName].filter(item => item.completed).length
        }))
        .sort((a, b) => {
          const aOrder = categoryOrder[a.name] || 999;
          const bOrder = categoryOrder[b.name] || 999;
          return aOrder - bOrder;
        });
    },

    flatShoppingItems() {
      // Return all items sorted by category, then alphabetically, then completed to bottom
      return [...this.shoppingItems].sort((a, b) => {
        // First, completed items go to bottom (highest priority)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // Then sort by category using a logical grocery store order
        const categoryOrder = this.getCategoryOrder;
        const aOrder = categoryOrder[a.category] || 999;
        const bOrder = categoryOrder[b.category] || 999;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        // Finally sort by name alphabetically
        return a.name.localeCompare(b.name);
      });
    },

    // Define logical grocery store category ordering
    getCategoryOrder() {
      return {
        'Produce': 1,
        'Dairy': 2,
        'Meat': 3,
        'Bakery': 4,
        'Frozen': 5,
        'Pantry': 6,
        'Household': 7,
        'Personal Care': 8,
        'General': 9
      };
    },

    // Debug computed property to help verify sorting is working
    debugShoppingItems() {
      return this.flatShoppingItems.map(item => ({
        name: item.name,
        category: item.category,
        completed: item.completed,
        sortOrder: this.getSortOrder(item)
      }));
    },

    getSortOrder(item) {
      let order = '';
      if (item.completed) order += 'ZZZ-'; // Completed items at bottom

      const categoryOrder = this.getCategoryOrder;
      const categoryNum = categoryOrder[item.category] || 999;
      order += categoryNum.toString().padStart(3, '0') + '-';
      order += item.category.padEnd(15, ' ');
      order += item.name;
      return order;
    }
  },
  inject: [
    // Shopping data now comes from Pinia store via setup()
    // shared api helper
    'apiCall',
    // app loading state for top-level loading gate
    'loading',
    // global utilities and helpers
    'Helpers'
  ],
  async mounted() {
    // Data is now preloaded by parent component - no need to load on mount!
    console.log('🛒 Shopping page mounted with preloaded data:');
    console.log('  - Shopping items:', this.shoppingItems.length);
    console.log('  - Quick items:', this.shoppingQuickItems.length);
    console.log('  - Stores:', this.stores.length);
  },
  methods: {
    // === Quicklist Accordion Methods (Requirements 5.3, 5.5) ===
    toggleQuicklistAccordion() {
      // Prevent collapse when search has text (Requirements 5.5)
      if (this.quicklistSearch && this.quicklistSearch.trim() !== '' && this.quicklistExpanded) {
        return; // Don't collapse while searching
      }
      this.quicklistExpanded = !this.quicklistExpanded;
    },

    clearQuicklistSearch() {
      this.quicklistSearch = '';
    },

    // === API Methods ===
    async reloadShoppingItems() {
      this.localLoading = true;
      this.error = null;
      try {
        await this.shoppingStore.loadItems();
      } catch (error) {
        console.error('Error reloading shopping items:', error);
        this.error = error.message;
      } finally {
        this.localLoading = false;
      }
    },

    async reloadQuickItems() {
      this.quickLoading = true;
      this.quickError = null;
      try {
        await this.shoppingStore.loadQuickItems();
      } catch (error) {
        console.error('Error reloading quick items:', error);
        this.quickError = error.message;
      } finally {
        this.quickLoading = false;
      }
    },

    async saveItem() {
      this.actionLoading = true;
      
      try {
        if (this.editMode && this.editingItem) {
          // Update existing item via store
          const itemId = this.editingItem.id;
          const updates = { ...this.editingItem };
          delete updates.id; // Don't send id in body
          
          const result = await this.shoppingStore.updateItem(itemId, updates);
          if (result.success) {
            if (result.offline) {
              this.showSuccessMessage('Item updated (will sync when online)');
            } else {
              this.showSuccessMessage('Item updated successfully!');
            }
          } else {
            this.showErrorMessage('Failed to update item: ' + (result.error || 'unknown error'));
          }
        } else {
          // Add new item via store
          const result = await this.shoppingStore.addItem(this.newItem);
          if (result.success) {
            if (result.offline) {
              this.showSuccessMessage('Item added (will sync when online)');
            } else {
              this.showSuccessMessage('Item added successfully!');
            }
          } else {
            this.showErrorMessage('Failed to add item: ' + (result.error || 'unknown error'));
          }
        }

        this.cancelEdit();
        this.newItem = { name: '', category: 'General', quantity: '', notes: '', store: '' };
      } catch (error) {
        console.error('Error saving item:', error);
        this.showErrorMessage('Error saving item: ' + (error?.message || 'unknown error'));
      } finally {
        this.actionLoading = false;
      }
    },

    async handleToggleItem(itemId) {
      console.log('[TOGGLE] Before toggle, itemId:', itemId);
      // Use store's toggleItemComplete method - handles offline-first logic
      await this.shoppingStore.toggleItemComplete(itemId);
      console.log('[TOGGLE] After toggle, categorySections will recompute');
    },

    async removeItem(itemId) {
      // Use store's deleteItem method - handles offline-first logic
      await this.shoppingStore.deleteItem(itemId);
    },

    async clearCompleted() {
      this.actionLoading = true;
      try {
        const result = await this.shoppingStore.clearCompleted();
        if (result.success) {
          this.showSuccessMessage('Completed items cleared!');
        } else {
          this.showErrorMessage('Error clearing completed items: ' + (result.error || 'unknown error'));
        }
      } catch (error) {
        console.error('Error clearing completed items:', error);
        this.showErrorMessage('Error clearing completed items: ' + (error?.message || 'unknown error'));
      } finally {
        this.actionLoading = false;
      }
    },

    async markAllComplete() {
      this.actionLoading = true;
      try {
        const result = await this.shoppingStore.markAllComplete();
        if (result.success) {
          this.showSuccessMessage('All items marked as complete!');
        } else {
          this.showErrorMessage('Error marking items complete: ' + (result.error || 'unknown error'));
        }
      } catch (error) {
        console.error('Error marking all items complete:', error);
        this.showErrorMessage('Error marking all items complete: ' + (error?.message || 'unknown error'));
      } finally {
        this.actionLoading = false;
      }
    },

    async clearAll() {
      if (!confirm('Are you sure you want to clear all items?')) return;
      this.actionLoading = true;
      try {
        const result = await this.shoppingStore.clearAll();
        if (result.success) {
          this.showSuccessMessage('All items cleared!');
        } else {
          this.showErrorMessage('Error clearing items: ' + (result.error || 'unknown error'));
        }
      } catch (error) {
        console.error('Error clearing all items:', error);
        this.showErrorMessage('Error clearing all items: ' + (error?.message || 'unknown error'));
      } finally {
        this.actionLoading = false;
      }
    },

    // === Quick List Methods ===
    async saveQuickItem() {
      this.quickActionLoading = true;
      try {
        if (this.editMode && this.editingQuickItem) {
          // Update existing quick item - still use API directly for quick items
          await this.apiCall(`${CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS}/${this.editingQuickItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(this.editingQuickItem)
          });
          this.showSuccessMessage('Quick item updated successfully!');
        } else {
          // Add new quick item
          const result = await this.shoppingStore.addQuickItem(this.newQuickItem);
          if (result.success) {
            this.showSuccessMessage('Quick item added successfully!');
          } else {
            this.showErrorMessage('Error adding quick item: ' + (result.error || 'unknown error'));
            return;
          }
        }

        await this.shoppingStore.loadQuickItems();
        this.cancelEdit();
        this.newQuickItem = { name: '', category: 'General', defaultQuantity: '', defaultNotes: '', defaultStore: '' };
      } catch (error) {
        console.error('Error saving quick item:', error);
        this.showErrorMessage('Error saving quick item: ' + (error?.message || 'unknown error'));
      } finally {
        this.quickActionLoading = false;
      }
    },

    async addQuickItemToList(quickItemId) {
      this.quickActionLoading = true;
      try {
        await this.apiCall(`${CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS}/${quickItemId}/add-to-list`, {
          method: 'POST'
        });
        // Reload items from store
        await this.shoppingStore.loadItems();
        this.showSuccessMessage('Item added to shopping list!');
      } catch (error) {
        console.error('Error adding quick item to list:', error);
        this.showErrorMessage('Error adding item to list: ' + (error?.message || 'unknown error'));
      } finally {
        this.quickActionLoading = false;
      }
    },

    async removeQuickItem(quickItemId) {
      if (!confirm('Are you sure you want to remove this quick item?')) return;
      try {
        const result = await this.shoppingStore.deleteQuickItem(quickItemId);
        if (!result.success) {
          this.showErrorMessage('Error removing quick item: ' + (result.error || 'unknown error'));
        }
      } catch (error) {
        console.error('Error removing quick item:', error);
        this.showErrorMessage('Error removing quick item: ' + (error?.message || 'unknown error'));
      }
    },

    async initializeQuickItems() {
      this.quickLoading = true;
      try {
        await this.apiCall(CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS_INITIALIZE, {
          method: 'POST'
        });
        // Use shopping store instead of $parent
        // _Requirements: 7.1, 7.2_
        const shoppingStore = window.useShoppingStore?.();
        if (shoppingStore) {
          await shoppingStore.loadQuickItems();
        }
      } catch (error) {
        console.error('Error initializing quick items:', error);
        alert('Error loading default items: ' + (error?.message || 'unknown error'));
      } finally {
        this.quickLoading = false;
      }
    },

    // === Store Management Methods ===
    async addStore() {
      this.storeLoading = true;
      try {
        await this.apiCall(CONFIG.API.ENDPOINTS.STORES, {
          method: 'POST',
          body: JSON.stringify(this.newStore)
        });
        // Use shopping store instead of $parent
        // _Requirements: 7.1, 7.2_
        const shoppingStore = window.useShoppingStore?.();
        if (shoppingStore) {
          await shoppingStore.loadStores();
        }
        this.newStore = { name: '' };
        this.showAddStoreModal = false;
        this.showSuccessMessage('Store added successfully!');
      } catch (error) {
        console.error('Error adding store:', error);
        alert('Error adding store: ' + (error?.message || 'unknown error'));
      } finally {
        this.storeLoading = false;
      }
    },

    async removeStore(storeId) {
      if (!confirm('Are you sure you want to remove this store?')) return;
      try {
        await this.apiCall(`${CONFIG.API.ENDPOINTS.STORES}/${storeId}`, {
          method: 'DELETE'
        });
        // Use shopping store instead of $parent
        // _Requirements: 7.1, 7.2_
        const shoppingStore = window.useShoppingStore?.();
        if (shoppingStore) {
          await shoppingStore.loadStores();
        }
      } catch (error) {
        console.error('Error removing store:', error);
        alert('Error removing store: ' + (error?.message || 'unknown error'));
      }
    },


    // === Edit Methods ===
    startEditItem(item) {
      // Create a deep copy of the item to avoid mutations
      this.editingItem = JSON.parse(JSON.stringify(item));
      this.editMode = true;
      this.showAddItemModal = true; // Reuse the existing modal

      // Ensure Vue reactivity by triggering a re-render
      this.$nextTick(() => {
        // Force re-evaluation of computed properties and bindings
        this.$forceUpdate();
      });
    },

    startEditQuickItem(quickItem) {
      // Create a deep copy of the quick item to avoid mutations
      this.editingQuickItem = JSON.parse(JSON.stringify(quickItem));
      this.editMode = true;
      this.showAddQuickItemModal = true; // Reuse the existing modal

      // Ensure Vue reactivity by triggering a re-render
      this.$nextTick(() => {
        // Force re-evaluation of computed properties and bindings
        this.$forceUpdate();
      });
    },

    cancelEdit() {
      this.editMode = false;
      this.editingItem = null;
      this.editingQuickItem = null;
      // Close all modals to ensure clean state
      this.showAddItemModal = false;
      this.showAddQuickItemModal = false;
    },

    showSuccessMessage(message) {
      this.successMessage = message;
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
      }, 3000);
    },

    showErrorMessage(message) {
      this.errorMessage = message;
      this.showError = true;
      setTimeout(() => {
        this.showError = false;
      }, 5000);
    },

    getStoreInitial(storeName) {
      return storeName ? storeName.charAt(0).toUpperCase() : '';
    },

    getStoreColor(storeName) {
      if (!storeName) return getComputedStyle(document.documentElement).getPropertyValue('--color-neutral-500') || '#6b7280';
      const root = getComputedStyle(document.documentElement);
      const palette = [
        root.getPropertyValue('--color-primary-500').trim(),
        root.getPropertyValue('--color-secondary-500').trim(),
        root.getPropertyValue('--color-success-600').trim(),
        root.getPropertyValue('--color-warning-600').trim(),
        root.getPropertyValue('--color-error-600').trim(),
        root.getPropertyValue('--color-primary-600').trim(),
        root.getPropertyValue('--color-secondary-600').trim()
      ].filter(Boolean);
      const colors = palette.length ? palette : ['#4A90E2','#7B68EE','#22c55e','#ea580c','#dc2626','#3a7bc8','#6d5ce6'];
      let hash = 0;
      for (let i = 0; i < storeName.length; i++) {
        const char = storeName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const colorIndex = Math.abs(hash) % colors.length;
      return colors[colorIndex];
    },

    getCategoryColors(category) {
      // Delegate to centralized shopping categories utility
      return window.ShoppingCategories.getCategoryColors(category);
    }
  }
});

// Export component for manual registration
window.ShoppingPageComponent = ShoppingPage; 
