// Shopping Page Component
const ShoppingPage = Vue.defineComponent({
  template: `
    <div class="space-y-6">
      <!-- Shopping List -->
      <div class="rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em]">🛒 Shopping List</h2>
          <button
            @click="showAddItemModal = true"
            class="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            :disabled="loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
            Add Item
          </button>
        </div>
        
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <div class="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary-500 border-t-transparent"></div>
          <p class="text-secondary-custom mt-2">Loading shopping items...</p>
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="text-center py-8 text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mx-auto mb-3" viewBox="0 0 256 256">
            <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8Z"></path>
          </svg>
          <p class="font-medium">Error loading shopping items</p>
          <p class="text-sm mt-1">{{ error }}</p>
          <button 
            @click="loadShoppingItems"
            class="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
        
        <!-- Shopping items grouped by store -->
        <div v-else class="space-y-6">
          <!-- Items grouped by store -->
          <div v-for="(items, storeName) in itemsByStore" :key="storeName" class="space-y-3">
            <div class="flex items-center justify-between border-b pb-2" style="border-color: var(--color-border-card);">
              <h3 class="text-lg font-bold text-primary-custom flex items-center gap-2">
                <div 
                  v-if="storeName !== 'No Store Selected'"
                  class="flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold text-white"
                  :style="{ backgroundColor: getStoreColor(storeName) }"
                >
                  {{ getStoreInitial(storeName) }}
                </div>
                <span v-else>🏪</span>
                {{ storeName || 'No Store Selected' }}
                <span class="text-sm font-normal text-secondary-custom">({{ items.length }} items)</span>
              </h3>
            </div>
            
            <div class="space-y-2">
              <div 
                v-for="item in items" 
                :key="item.id"
                class="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer"
                style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);"
              >
                <input 
                  type="checkbox" 
                  :checked="item.completed"
                  @change="toggleItem(item.id)"
                  class="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                >
                <div class="flex-1">
                  <span 
                    :class="item.completed ? 'line-through text-white opacity-60' : 'text-white'"
                    class="font-medium"
                  >
                    {{ item.name }}
                  </span>
                  <div class="text-sm text-white text-opacity-90 flex items-center gap-2 mt-1">
                    <span>{{ getCategoryIcon(item.category) }} {{ item.category }}</span>
                    <span v-if="item.quantity">• Qty: {{ item.quantity }}</span>
                    <span v-if="item.notes">• {{ item.notes }}</span>
                  </div>
                </div>
                <button
                  @click="removeItem(item.id)"
                  class="text-red-300 hover:text-red-100 p-1 rounded transition-colors bg-red-500 bg-opacity-20 hover:bg-opacity-30"
                  title="Remove item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="shoppingItems.length === 0" class="text-center py-8 text-secondary-custom">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mx-auto mb-3 opacity-50" viewBox="0 0 256 256">
              <path d="M222.14,58.87A8,8,0,0,0,216,56H54.68L49.79,29.14A16,16,0,0,0,34.05,16H16a8,8,0,0,0,0,16H34.05l31.1,180.14A16,16,0,0,0,80.89,224H208a8,8,0,0,0,0-16H80.89L78.18,192H188.1a16,16,0,0,0,15.74-13.14L222.14,58.87ZM188.1,176H75.17l-18.73-108H207.37Z"></path>
            </svg>
            <p>Your shopping list is empty.</p>
            <p class="text-sm mt-1">Click "Add Item" to get started or use the quick list below!</p>
          </div>
        </div>
      </div>

      <!-- Quick List -->
      <div class="rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em]">⚡ Quick List</h2>
          <div class="flex gap-2">
            <button
              @click="showAddQuickItemModal = true"
              class="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm"
              :disabled="quickLoading"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
              Add Quick Item
            </button>
          </div>
        </div>
        
        <p class="text-sm text-secondary-custom mb-4">Tap any item below to quickly add it to your shopping list!</p>
        
        <!-- Quick loading state -->
        <div v-if="quickLoading" class="text-center py-4">
          <div class="spinner-border animate-spin inline-block w-6 h-6 border-4 rounded-full border-primary-500 border-t-transparent"></div>
          <p class="text-secondary-custom mt-2 text-sm">Loading quick items...</p>
        </div>
        
        <!-- Quick error state -->
        <div v-else-if="quickError" class="text-center py-4 text-red-600">
          <p class="text-sm">{{ quickError }}</p>
          <button 
            @click="loadQuickItems"
            class="mt-2 px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
        
        <!-- Quick items grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <div
            v-for="quickItem in quickItems"
            :key="quickItem.id"
            class="relative flex flex-col items-center gap-2 p-3 rounded-lg group cursor-pointer transition-all duration-200 hover:shadow-md"
            style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);"
            @click="addQuickItemToList(quickItem.id)"
          >
            <!-- Store badge (top-left corner) -->
            <div 
              v-if="quickItem.defaultStore" 
              class="absolute -top-1 -left-1 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shadow-sm"
              :style="{ backgroundColor: getStoreColor(quickItem.defaultStore) }"
              :title="quickItem.defaultStore"
            >
              {{ getStoreInitial(quickItem.defaultStore) }}
            </div>
            
            <!-- Delete button (top-right corner) -->
            <button
              @click.stop="removeQuickItem(quickItem.id)"
              class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center text-sm sm:text-xs sm:opacity-0 sm:group-hover:opacity-100 opacity-60 transition-opacity duration-200 hover:bg-red-600 touch-target"
              title="Remove quick item"
              :disabled="quickActionLoading"
            >
              ×
            </button>
            
            <div class="text-2xl">{{ getCategoryIcon(quickItem.category) }}</div>
            <div class="text-sm font-medium text-white text-center">{{ quickItem.name }}</div>
            <div class="text-xs text-white text-opacity-90 text-center">{{ quickItem.category }}</div>
            <div v-if="quickItem.defaultQuantity" class="text-xs text-white text-opacity-80">{{ quickItem.defaultQuantity }}</div>
            
            <!-- Store name (bottom, only visible on hover for better UX) -->
            <div 
              v-if="quickItem.defaultStore" 
              class="absolute bottom-1 left-1 right-1 text-xs text-center bg-white bg-opacity-20 text-white px-1 py-0.5 rounded sm:opacity-0 sm:group-hover:opacity-100 opacity-75 transition-opacity duration-200"
            >
              🏪 {{ quickItem.defaultStore }}
            </div>
          </div>
          
          <div v-if="quickItems.length === 0" class="col-span-full text-center py-8 text-secondary-custom">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="mx-auto mb-2 opacity-50" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"></path>
            </svg>
            <p>No quick items available.</p>
            <p class="text-sm mt-1">Click "Add Quick Item" to create some common items!</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">⚡ Quick Actions</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            @click="clearCompleted"
            class="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors"
            :disabled="completedItems === 0 || actionLoading"
            :class="completedItems === 0 || actionLoading ? 'opacity-50 cursor-not-allowed' : ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
            </svg>
            Clear Completed
          </button>
          
          <button
            @click="markAllComplete"
            class="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors"
            :disabled="pendingItems === 0 || actionLoading"
            :class="pendingItems === 0 || actionLoading ? 'opacity-50 cursor-not-allowed' : ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"></path>
            </svg>
            Mark All Complete
          </button>
          
          <button
            @click="clearAll"
            class="flex items-center justify-center gap-2 bg-primary-500 text-white px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            :disabled="shoppingItems.length === 0 || actionLoading"
            :class="shoppingItems.length === 0 || actionLoading ? 'opacity-50 cursor-not-allowed' : ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"></path>
            </svg>
            Clear All
          </button>
        </div>
      </div>

      <!-- Store Management -->
      <div class="rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em]">🏪 Store Management</h2>
          <button
            @click="showAddStoreModal = true"
            class="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            :disabled="storeLoading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
            Add Store
          </button>
        </div>
        
        <!-- Store loading state -->
        <div v-if="storeLoading" class="text-center py-4">
          <div class="spinner-border animate-spin inline-block w-6 h-6 border-4 rounded-full border-primary-500 border-t-transparent"></div>
          <p class="text-secondary-custom mt-2 text-sm">Loading stores...</p>
        </div>
        
        <!-- Stores list -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div 
            v-for="store in stores" 
            :key="store.id"
            class="flex items-center justify-between p-3 rounded-lg transition-colors"
            style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);"
          >
            <div class="flex items-center gap-2">
              <div 
                class="flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold text-white bg-white bg-opacity-20"
              >
                {{ getStoreInitial(store.name) }}
              </div>
              <span class="font-medium text-white">{{ store.name }}</span>
            </div>
            <button
              @click="removeStore(store.id)"
              class="text-red-300 hover:text-red-100 p-1 rounded transition-colors bg-red-500 bg-opacity-20 hover:bg-opacity-30"
              title="Remove store"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
              </svg>
            </button>
          </div>
          
          <div v-if="stores.length === 0" class="col-span-full text-center py-4 text-secondary-custom">
            <p>No stores added yet.</p>
            <p class="text-sm mt-1">Click "Add Store" to get started!</p>
          </div>
        </div>
      </div>

      <!-- Add Item Modal -->
      <div v-if="showAddItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-bold mb-4">Add Shopping Item</h3>
          
          <form @submit.prevent="addItem">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Item Name *</label>
                <input
                  v-model="newItem.name"
                  type="text"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter item name"
                  required
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Category</label>
                <select
                  v-model="newItem.category"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  v-model="newItem.store"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Store Selected</option>
                  <option v-for="store in stores" :key="store.id" :value="store.name">{{ store.name }}</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Quantity</label>
                <input
                  v-model="newItem.quantity"
                  type="text"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2 lbs, 1 gallon"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Notes</label>
                <input
                  v-model="newItem.notes"
                  type="text"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special notes"
                >
              </div>
            </div>
            
            <div class="flex gap-3 mt-6">
              <button
                type="button"
                @click="showAddItemModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                :disabled="!newItem.name || actionLoading"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Quick Item Modal -->
      <div v-if="showAddQuickItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-bold mb-4">Add Quick Item</h3>
          
          <form @submit.prevent="addQuickItem">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Item Name *</label>
                <input
                  v-model="newQuickItem.name"
                  type="text"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter item name"
                  required
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Category</label>
                <select
                  v-model="newQuickItem.category"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  v-model="newQuickItem.defaultQuantity"
                  type="text"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2 lbs, 1 gallon"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Default Notes</label>
                <input
                  v-model="newQuickItem.defaultNotes"
                  type="text"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any default notes"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Default Store</label>
                <select
                  v-model="newQuickItem.defaultStore"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                @click="showAddQuickItemModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                :disabled="!newQuickItem.name || quickActionLoading"
              >
                Add Quick Item
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Store Modal -->
      <div v-if="showAddStoreModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-bold mb-4">Add Store</h3>
          
          <form @submit.prevent="addStore">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Store Name *</label>
                <input
                  v-model="newStore.name"
                  type="text"
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter store name"
                  required
                >
              </div>
            </div>
            
            <div class="flex gap-3 mt-6">
              <button
                type="button"
                @click="showAddStoreModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                :disabled="!newStore.name || storeLoading"
              >
                Add Store
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccess" class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
        {{ successMessage }}
      </div>
    </div>
  `,
  data() {
    return {
      // Note: shoppingItems, quickItems, and stores are now provided by parent (preloaded)
      localLoading: false,
      quickLoading: false,
      storeLoading: false,
      actionLoading: false,
      quickActionLoading: false,
      error: null,
      quickError: null,
      showAddItemModal: false,
      showAddQuickItemModal: false,
      showAddStoreModal: false,
      showSuccess: false,
      successMessage: '',
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
      }
    };
  },
  computed: {
    completedItems() {
      return this.shoppingItems.filter(item => item.completed).length;
    },
    
    pendingItems() {
      return this.shoppingItems.filter(item => !item.completed).length;
    },
    
    completionPercentage() {
      return this.shoppingItems.length > 0 ? Math.round((this.completedItems / this.shoppingItems.length) * 100) : 0;
    },

    itemsByStore() {
      const grouped = {};
      this.shoppingItems.forEach(item => {
        const storeName = item.store || 'No Store Selected';
        if (!grouped[storeName]) {
          grouped[storeName] = [];
        }
        grouped[storeName].push(item);
      });
      return grouped;
    },
    
    // Use injected data with fallback names for template compatibility
    quickItems() {
      return this.shoppingQuickItems;
    }
  },
  inject: [
    // Preloaded data from parent
    'shoppingItems',
    'shoppingQuickItems', 
    'stores'
  ],
  async mounted() {
    // Data is now preloaded by parent component - no need to load on mount!
    console.log('🛒 Shopping page mounted with preloaded data:');
    console.log('  - Shopping items:', this.shoppingItems.length);
    console.log('  - Quick items:', this.shoppingQuickItems.length);
    console.log('  - Stores:', this.stores.length);
  },
  methods: {
    // === API Methods ===
    // Data reloading methods (now trigger parent to reload)
    async reloadShoppingItems() {
      this.localLoading = true;
      this.error = null;
      
      try {
        // Reload data in parent component
        await this.$parent.loadShoppingItems();
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
        // Reload data in parent component
        await this.$parent.loadShoppingQuickItems();
      } catch (error) {
        console.error('Error reloading quick items:', error);
        this.quickError = error.message;
      } finally {
        this.quickLoading = false;
      }
    },

    async addItem() {
      this.actionLoading = true;
      
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS), {
          method: 'POST',
          headers,
          body: JSON.stringify(this.newItem)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // Reload shopping items to get updated data
        await this.$parent.loadShoppingItems();
        
        // Reset form and close modal
        this.newItem = { name: '', category: 'General', quantity: '', notes: '', store: '' };
        this.showAddItemModal = false;
        this.showSuccessMessage('Item added successfully!');
      } catch (error) {
        console.error('Error adding item:', error);
        alert('Error adding item: ' + error.message);
      } finally {
        this.actionLoading = false;
      }
    },

    async toggleItem(itemId) {
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS + '/' + itemId + '/toggle'), {
          method: 'PUT',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // Reload shopping items to get updated data
        await this.$parent.loadShoppingItems();
      } catch (error) {
        console.error('Error toggling item:', error);
        alert('Error updating item: ' + error.message);
      }
    },

    async removeItem(itemId) {
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS + '/' + itemId), {
          method: 'DELETE',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Reload shopping items to get updated data
        await this.$parent.loadShoppingItems();
        this.showSuccessMessage('Item removed successfully!');
      } catch (error) {
        console.error('Error removing item:', error);
        alert('Error removing item: ' + error.message);
      }
    },

    async clearCompleted() {
      this.actionLoading = true;
      
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS_CLEAR_COMPLETED), {
          method: 'POST',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        await this.$parent.loadShoppingItems(); // Reload the list
        this.showSuccessMessage(`${data.clearedCount} completed items cleared!`);
      } catch (error) {
        console.error('Error clearing completed items:', error);
        alert('Error clearing completed items: ' + error.message);
      } finally {
        this.actionLoading = false;
      }
    },

    async markAllComplete() {
      this.actionLoading = true;
      
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS_MARK_ALL_COMPLETE), {
          method: 'POST',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        await this.$parent.loadShoppingItems(); // Reload the list
        this.showSuccessMessage(`${data.updatedCount} items marked as complete!`);
      } catch (error) {
        console.error('Error marking all items complete:', error);
        alert('Error marking all items complete: ' + error.message);
      } finally {
        this.actionLoading = false;
      }
    },

    async clearAll() {
      if (!confirm('Are you sure you want to clear all items?')) {
        return;
      }
      
      this.actionLoading = true;
      
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS_CLEAR_ALL), {
          method: 'POST',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        await this.$parent.loadShoppingItems(); // Reload the list
        this.showSuccessMessage(`${data.clearedCount} items cleared!`);
      } catch (error) {
        console.error('Error clearing all items:', error);
        alert('Error clearing all items: ' + error.message);
      } finally {
        this.actionLoading = false;
      }
    },

    // === Quick List Methods ===
    async addQuickItem() {
      this.quickActionLoading = true;
      
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS), {
          method: 'POST',
          headers,
          body: JSON.stringify(this.newQuickItem)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        await this.$parent.loadShoppingQuickItems(); // Reload quick items
        
        // Reset form and close modal
        this.newQuickItem = { name: '', category: 'General', defaultQuantity: '', defaultNotes: '', defaultStore: '' };
        this.showAddQuickItemModal = false;
        this.showSuccessMessage('Quick item added successfully!');
      } catch (error) {
        console.error('Error adding quick item:', error);
        alert('Error adding quick item: ' + error.message);
      } finally {
        this.quickActionLoading = false;
      }
    },

    async addQuickItemToList(quickItemId) {
      this.quickActionLoading = true;
      
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS + '/' + quickItemId + '/add-to-list'), {
          method: 'POST',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        await this.$parent.loadShoppingItems(); // Reload shopping items
        this.showSuccessMessage('Item added to shopping list!');
      } catch (error) {
        console.error('Error adding quick item to list:', error);
        alert('Error adding item to list: ' + error.message);
      } finally {
        this.quickActionLoading = false;
      }
    },

    async removeQuickItem(quickItemId) {
      if (!confirm('Are you sure you want to remove this quick item?')) {
        return;
      }
      
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS + '/' + quickItemId), {
          method: 'DELETE',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        await this.$parent.loadShoppingQuickItems(); // Reload quick items
        this.showSuccessMessage('Quick item removed successfully!');
      } catch (error) {
        console.error('Error removing quick item:', error);
        alert('Error removing quick item: ' + error.message);
      }
    },

    async initializeQuickItems() {
      this.quickLoading = true;
      
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS_INITIALIZE), {
          method: 'POST',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        await this.$parent.loadShoppingQuickItems(); // Reload quick items
        // this.showSuccessMessage('Default quick items loaded!');
      } catch (error) {
        console.error('Error initializing quick items:', error);
        alert('Error loading default items: ' + error.message);
      } finally {
        this.quickLoading = false;
      }
    },

    // === Store Management Methods ===

    async addStore() {
      this.storeLoading = true;
      
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.STORES), {
          method: 'POST',
          headers,
          body: JSON.stringify(this.newStore)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        await this.$parent.loadStores(); // Reload stores
        
        // Reset form and close modal
        this.newStore = { name: '' };
        this.showAddStoreModal = false;
        this.showSuccessMessage('Store added successfully!');
      } catch (error) {
        console.error('Error adding store:', error);
        alert('Error adding store: ' + error.message);
      } finally {
        this.storeLoading = false;
      }
    },

    async removeStore(storeId) {
      if (!confirm('Are you sure you want to remove this store?')) {
        return;
      }
      
      try {
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.STORES + '/' + storeId), {
          method: 'DELETE',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        await this.$parent.loadStores(); // Reload stores
        this.showSuccessMessage('Store removed successfully!');
      } catch (error) {
        console.error('Error removing store:', error);
        alert('Error removing store: ' + error.message);
      }
    },

    // === Helper Methods ===
    getCategoryIcon(category) {
      const icons = {
        'Dairy': '🥛',
        'Bakery': '🍞',
        'Produce': '🥬',
        'Meat': '🥩',
        'Frozen': '🧊',
        'Pantry': '🥫',
        'Household': '🧹',
        'Personal Care': '🧴',
        'General': '📦'
      };
      return icons[category] || '📦';
    },

    showSuccessMessage(message) {
      this.successMessage = message;
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
      }, 3000);
    },

    // Get the first letter of store name for the badge
    getStoreInitial(storeName) {
      return storeName ? storeName.charAt(0).toUpperCase() : '';
    },

    // Generate a consistent color for each store based on its name
    getStoreColor(storeName) {
      if (!storeName) return '#6b7280'; // gray-500 default
      
      // Predefined color palette for stores
      const colors = [
        '#ef4444', // red-500
        '#f97316', // orange-500
        '#eab308', // yellow-500
        '#22c55e', // green-500
        '#06b6d4', // cyan-500
        '#3b82f6', // blue-500
        '#8b5cf6', // violet-500
        '#ec4899', // pink-500
        '#f59e0b', // amber-500
        '#10b981', // emerald-500
        '#6366f1', // indigo-500
        '#84cc16'  // lime-500
      ];
      
      // Generate a consistent hash from the store name
      let hash = 0;
      for (let i = 0; i < storeName.length; i++) {
        const char = storeName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      // Use the hash to pick a color consistently
      const colorIndex = Math.abs(hash) % colors.length;
      return colors[colorIndex];
    }
  }
});

// Export component for manual registration
window.ShoppingPageComponent = ShoppingPage; 