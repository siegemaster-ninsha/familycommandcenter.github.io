// Shopping Page Component
const ShoppingPage = Vue.defineComponent({
  template: `
    <div class="space-y-6 pb-24 sm:pb-0">
      <!-- Shopping List -->
      <div class="rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
            <ShoppingBagIcon class="w-5 h-5" />
            Shopping List
          </h2>
          <div class="flex items-center gap-2">
            <!-- Sort by Store Toggle -->
            <div class="hidden sm:flex items-center gap-2">
              <span class="text-sm text-secondary-custom">Sort by Store</span>
              <button
                @click="toggleViewMode"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                :class="viewMode === 'byStore' ? 'bg-primary-600' : 'bg-gray-200'"
                :disabled="loading"
                :title="viewMode === 'byStore' ? 'Switch to flat list view' : 'Switch to grouped by store view'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="viewMode === 'byStore' ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
            <button
              @click="showAddItemModal = true"
              class="hidden sm:flex items-center gap-2 btn-primary touch-target"
              :disabled="loading"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
              Add Item
            </button>
          </div>
        </div>
        
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <div class="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary-500 border-t-transparent"></div>
          <p class="text-secondary-custom mt-2">Loading shopping items...</p>
        </div>
        
        <!-- Error state -->
          <div v-else-if="error" class="text-center py-8" style="color: var(--color-error-700);">
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
        
        <!-- Shopping items - conditional rendering based on view mode -->
        <div v-else>
          <!-- Grouped by store view -->
          <div v-if="viewMode === 'byStore'" class="space-y-6">
            <!-- Items grouped by store - only show in store view mode -->
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
                  <span v-else class="inline-flex items-center">
                    <BuildingStorefrontIcon class="w-5 h-5 text-secondary-custom" />
                  </span>
                  {{ storeName || 'No Store Selected' }}
                  <span class="text-sm font-normal text-secondary-custom">({{ items.length }} items)</span>
                </h3>
              </div>

              <div class="space-y-2">
                <div
                  v-for="item in items"
                  :key="item.id"
                  class="flex items-center gap-3 p-4 sm:p-3 rounded-lg transition-colors cursor-pointer"
                  @click="toggleItem(item.id)"
                  style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);"
                >
                  <input
                    type="checkbox"
                    :checked="item.completed"
                    @change.stop="toggleItem(item.id)"
                    class="sm:w-5 sm:h-5 w-6 h-6 rounded focus:ring-success-600 touch-target text-success-600"
                  >
                  <div class="flex-1">
                    <span
                      :class="item.completed ? 'line-through text-white opacity-60' : 'text-white'"
                      class="font-medium text-lg sm:text-base"
                    >
                      {{ item.name }}
                    </span>
                    <div class="text-base sm:text-sm text-white text-opacity-90 flex items-center gap-2 mt-1">
                      <span class="inline-flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 opacity-90"><path d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm7.53-3.28a.75.75 0 10-1.06 1.06L10.94 12l-2.22 2.22a.75.75 0 101.06 1.06L12 13.06l2.22 2.22a.75.75 0 101.06-1.06L13.06 12l2.22-2.22a.75.75 0 10-1.06-1.06L12 10.94 9.78 8.72z"/></svg>
                        <span>{{ item.category }}</span>
                      </span>
                      <span v-if="item.quantity">• Qty: {{ item.quantity }}</span>
                      <span v-if="item.notes">• {{ item.notes }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      @click.stop="startEditItem(item)"
                      class="btn-icon btn-icon--secondary"
                      title="Edit item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      @click.stop="removeItem(item.id)"
                      class="btn-icon btn-icon--danger"
                      title="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.41 12l4.3-4.29a1 1 0 10-1.42-1.42L12 10.59 7.71 6.29a1 1 0 10-1.42 1.42L10.59 12l-4.3 4.29a1 1 0 101.42 1.42L12 13.41l4.29 4.3a1 1 0 001.42-1.42z"/></svg>
                    </button>
                  </div>
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

          <!-- Flat list view -->
          <div v-else class="space-y-3">
            <div class="flex items-center justify-between border-b pb-2 mb-4" style="border-color: var(--color-border-card);">
              <h3 class="text-lg font-bold text-primary-custom">All Items</h3>
              <span class="text-sm font-normal text-secondary-custom">({{ shoppingItems.length }} items)</span>
            </div>

            <div class="space-y-2">
              <div
                v-for="item in flatShoppingItems"
                :key="item.id"
                class="flex items-center gap-3 p-4 sm:p-3 rounded-lg transition-colors cursor-pointer"
                @click="toggleItem(item.id)"
                style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);"
              >
                <input
                  type="checkbox"
                  :checked="item.completed"
                  @change.stop="toggleItem(item.id)"
                  class="sm:w-5 sm:h-5 w-6 h-6 rounded focus:ring-success-600 touch-target text-success-600"
                >
                <div class="flex-1">
                  <span
                    :class="item.completed ? 'line-through text-white opacity-60' : 'text-white'"
                    class="font-medium text-lg sm:text-base"
                  >
                    {{ item.name }}
                  </span>
                  <div class="text-base sm:text-sm text-white text-opacity-90 flex items-center gap-2 mt-1">
                    <span class="inline-flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 opacity-90"><path d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm7.53-3.28a.75.75 0 10-1.06 1.06L10.94 12l-2.22 2.22a.75.75 0 101.06 1.06L12 13.06l2.22 2.22a.75.75 0 101.06-1.06L13.06 12l2.22-2.22a.75.75 0 10-1.06-1.06L12 10.94 9.78 8.72z"/></svg>
                      <span>{{ item.category }}</span>
                    </span>
                    <span v-if="item.quantity">• Qty: {{ item.quantity }}</span>
                    <span v-if="item.notes">• {{ item.notes }}</span>
                    <span v-if="item.store" class="inline-flex items-center gap-1 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                      <BuildingStorefrontIcon class="w-3 h-3" />
                      {{ item.store }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    @click.stop="startEditItem(item)"
                    class="btn-icon btn-icon--secondary"
                    title="Edit item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    @click.stop="removeItem(item.id)"
                    class="btn-icon btn-icon--danger"
                    title="Remove item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.41 12l4.3-4.29a1 1 0 10-1.42-1.42L12 10.59 7.71 6.29a1 1 0 10-1.42 1.42L10.59 12l-4.3 4.29a1 1 0 101.42 1.42L12 13.41l4.29 4.3a1 1 0 001.42-1.42z"/></svg>
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
      </div>

      <!-- Quick List -->
      <div class="rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M13.5 4.5a.75.75 0 00-1.312-.53L6 12h3.75L8.25 19.5a.75.75 0 001.312.53L18 12h-3.75L13.5 4.5z"/></svg>
            Quick List
          </h2>
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
        
        <!-- Quick items grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <div
            v-for="quickItem in quickItems"
            :key="quickItem.id"
            :class="['relative flex flex-col items-center gap-2 p-3 rounded-lg group cursor-pointer transition-all duration-200 hover:shadow-md', quickItem.defaultStore ? 'pb-7' : '']"
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
            
            <!-- Action buttons (top corners) -->
            <div class="absolute -top-1 -right-1 flex gap-2">
              <button
                @click.stop="startEditQuickItem(quickItem)"
                class="text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-60 hover:opacity-100 transition-opacity duration-200 touch-target"
                style="background: var(--color-secondary-600)"
                title="Edit quick item"
                :disabled="quickActionLoading"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                @click.stop="removeQuickItem(quickItem.id)"
                class="text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-60 hover:opacity-100 transition-opacity duration-200 touch-target"
                style="background: var(--color-error-600)"
                title="Remove quick item"
                :disabled="quickActionLoading"
              >
                ×
              </button>
            </div>
            
            <div class="text-2xl text-white opacity-90">
              <!-- generic item icon -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7"><path d="M3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75zm3 0a.75.75 0 01.75-.75h10.5a.75.75 0 01.75.75V9H6V6.75z"/></svg>
            </div>
            <div class="text-sm font-medium text-white text-center">{{ quickItem.name }}</div>
            <div class="text-xs text-white text-opacity-90 text-center">{{ quickItem.category }}</div>
            <div v-if="quickItem.defaultQuantity" class="text-xs text-white text-opacity-80">{{ quickItem.defaultQuantity }}</div>
            
            <!-- Store name (bottom, only visible on hover for better UX) -->
            <div 
              v-if="quickItem.defaultStore" 
              class="absolute bottom-1 left-1 right-1 text-xs text-center bg-white bg-opacity-20 text-white px-1 py-0.5 rounded sm:opacity-0 sm:group-hover:opacity-100 opacity-75 transition-opacity duration-200"
            >
              <span class="inline-flex items-center gap-1 justify-center">
                <BuildingStorefrontIcon class="w-4 h-4" />
                <span>{{ quickItem.defaultStore }}</span>
              </span>
            </div>
          </div>
          
          <div v-if="quickItems.length === 0" class="col-span-full text-center py-4 sm:py-8 text-secondary-custom">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="mx-auto mb-2 opacity-50" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"></path>
            </svg>
            <p>No quick items available.</p>
            <p class="text-sm mt-1">Click "Add Quick Item" to create some common items!</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="hidden sm:block rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M13.5 4.5a.75.75 0 00-1.312-.53L6 12h3.75L8.25 19.5a.75.75 0 001.312.53L18 12h-3.75L13.5 4.5z"/></svg>
          Quick Actions
        </h2>
        
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            @click="clearCompleted"
            class="flex items-center justify-center gap-2 btn-error touch-target"
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
            class="flex items-center justify-center gap-2 btn-success touch-target"
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
            class="flex items-center justify-center gap-2 btn-primary touch-target"
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
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
            <BuildingStorefrontIcon class="w-5 h-5" />
            Store Management
          </h2>
          <div class="flex items-center gap-2">
            <button 
              class="btn-secondary touch-target sm:hidden"
              @click="storeExpandedMobile = !storeExpandedMobile"
              :aria-expanded="storeExpandedMobile"
              title="Toggle store management"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" :class="[storeExpandedMobile ? 'rotate-180' : 'rotate-0', 'transition-transform duration-200']"><path d="M128,160a8,8,0,0,1-5.66-2.34l-48-48a8,8,0,0,1,11.32-11.32L128,140.69l42.34-42.35a8,8,0,0,1,11.32,11.32l-48,48A8,8,0,0,1,128,160Z"></path></svg>
            </button>
            <button
              @click="showAddStoreModal = true"
              class="flex items-center gap-2 btn-primary touch-target"
              :disabled="storeLoading"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
              Add Store
            </button>
          </div>
        </div>
        
        <div :class="(storeExpandedMobile ? 'block' : 'hidden') + ' sm:block'">
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
              class="p-1 rounded transition-colors"
              title="Remove store"
              style="color: var(--color-error-600); background: color-mix(in srgb, var(--color-error-50) 70%, transparent);"
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
      </div>

      <!-- Add/Edit Item Modal -->
      <div v-if="showAddItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-bold mb-4">{{ editMode ? 'Edit Shopping Item' : 'Add Shopping Item' }}</h3>

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
          <h3 class="text-lg font-bold mb-4">{{ editMode ? 'Edit Quick Item' : 'Add Quick Item' }}</h3>

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
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  style="border-color: var(--color-border-card)"
                  placeholder="Enter store name"
                  required
                >
              </div>
            </div>
            
            <div class="flex gap-3 mt-6">
              <button
                type="button"
                @click="showAddStoreModal = false"
                class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                style="border-color: var(--color-border-card)"
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
      <div v-if="showSuccess" class="fixed top-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50" style="background: var(--color-success-600);">
        {{ successMessage }}
      </div>

      <!-- Mobile Floating Add Button (FAB) -->
      <button 
        class="fab-add-item sm:hidden"
        @click="showAddItemModal = true"
        :disabled="loading"
        aria-label="Add item"
        title="Add item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M13 11h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5a1 1 0 112 0v6z"/>
        </svg>
      </button>
    </div>
  `,
  data() {
    return {
      // Note: shoppingItems, quickItems, and stores are now provided by parent (preloaded)
      localLoading: false,
      quickLoading: false,
      storeLoading: false,
      storeExpandedMobile: false,
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
      },
      viewMode: 'byStore', // 'byStore' or 'flat'
      showEditItemModal: false,
      showEditQuickItemModal: false,
      editingItem: null, // The shopping item being edited
      editingQuickItem: null, // The quicklist item being edited
      editMode: false // true for edit, false for add
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

      // Sort items within each store: by category, then alphabetically, then completed to bottom
      Object.keys(grouped).forEach(storeName => {
        grouped[storeName].sort((a, b) => {
          // First, completed items go to bottom
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;

          // Then sort by category alphabetically
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }

          // Finally sort by name alphabetically
          return a.name.localeCompare(b.name);
        });
      });

      return grouped;
    },
    
    // Use injected data with fallback names for template compatibility
    quickItems() {
      return this.shoppingQuickItems;
    },

    flatShoppingItems() {
      // Return all items sorted by category, then alphabetically, then completed to bottom
      return [...this.shoppingItems].sort((a, b) => {
        // First, completed items go to bottom
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;

        // Then sort by category alphabetically
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }

        // Finally sort by name alphabetically
        return a.name.localeCompare(b.name);
      });
    }
  },
  inject: [
    // Preloaded data from parent
    'shoppingItems',
    'shoppingQuickItems', 
    'stores',
    // shared api helper
    'apiCall',
    // app loading state for top-level loading gate
    'loading'
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
    async reloadShoppingItems() {
      this.localLoading = true;
      this.error = null;
      try {
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
        await this.$parent.loadShoppingQuickItems();
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
          // Update existing item
          await this.apiCall(`${CONFIG.API.ENDPOINTS.SHOPPING_ITEMS}/${this.editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(this.editingItem)
          });
          this.showSuccessMessage('Item updated successfully!');
        } else {
          // Add new item
          await this.apiCall(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS, {
            method: 'POST',
            body: JSON.stringify(this.newItem)
          });
          this.showSuccessMessage('Item added successfully!');
        }

        await this.$parent.loadShoppingItems();
        this.cancelEdit();
        this.newItem = { name: '', category: 'General', quantity: '', notes: '', store: '' };
      } catch (error) {
        console.error('Error saving item:', error);
        alert('Error saving item: ' + (error?.message || 'unknown error'));
      } finally {
        this.actionLoading = false;
      }
    },

    async toggleItem(itemId) {
      // Find the item in the local array for optimistic update
      const itemIndex = this.shoppingItems.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        console.error('Item not found:', itemId);
        return;
      }

      // Store the previous state for potential rollback
      const previousState = this.shoppingItems[itemIndex].completed;

      // Optimistic update - immediately toggle the local state
      this.shoppingItems[itemIndex].completed = !previousState;

      try {
        // Make the API call to persist the change
        const response = await this.apiCall(`${CONFIG.API.ENDPOINTS.SHOPPING_ITEMS}/${itemId}/toggle`, {
          method: 'PUT'
        });

        // Update with server response if it differs from our optimistic update
        if (response.item && response.item.completed !== this.shoppingItems[itemIndex].completed) {
          this.shoppingItems[itemIndex].completed = response.item.completed;
        }

        // Check if we need to clear any completed stores
        this.checkAndClearCompletedStores();
      } catch (error) {
        console.error('Error toggling item:', error);

        // Rollback the optimistic update on error
        this.shoppingItems[itemIndex].completed = previousState;

        alert('Error updating item: ' + (error?.message || 'unknown error'));

        // Fallback: reload items to ensure consistency
        try {
          await this.$parent.loadShoppingItems();
        } catch (reloadError) {
          console.error('Error reloading items after toggle failure:', reloadError);
        }
      }
    },

    async removeItem(itemId) {
      try {
        await this.apiCall(`${CONFIG.API.ENDPOINTS.SHOPPING_ITEMS}/${itemId}`, {
          method: 'DELETE'
        });
        await this.$parent.loadShoppingItems();
      } catch (error) {
        console.error('Error removing item:', error);
        alert('Error removing item: ' + (error?.message || 'unknown error'));
      }
    },

    async clearCompleted() {
      this.actionLoading = true;
      try {
        const data = await this.apiCall(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS_CLEAR_COMPLETED, {
          method: 'POST'
        });
        await this.$parent.loadShoppingItems();
        this.showSuccessMessage(`${data.clearedCount} completed items cleared!`);
      } catch (error) {
        console.error('Error clearing completed items:', error);
        alert('Error clearing completed items: ' + (error?.message || 'unknown error'));
      } finally {
        this.actionLoading = false;
      }
    },

    async markAllComplete() {
      this.actionLoading = true;
      try {
        const data = await this.apiCall(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS_MARK_ALL_COMPLETE, {
          method: 'POST'
        });
        await this.$parent.loadShoppingItems();
        this.showSuccessMessage(`${data.updatedCount} items marked as complete!`);
      } catch (error) {
        console.error('Error marking all items complete:', error);
        alert('Error marking all items complete: ' + (error?.message || 'unknown error'));
      } finally {
        this.actionLoading = false;
      }
    },

    async clearAll() {
      if (!confirm('Are you sure you want to clear all items?')) return;
      this.actionLoading = true;
      try {
        const data = await this.apiCall(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS_CLEAR_ALL, {
          method: 'POST'
        });
        await this.$parent.loadShoppingItems();
        this.showSuccessMessage(`${data.clearedCount} items cleared!`);
      } catch (error) {
        console.error('Error clearing all items:', error);
        alert('Error clearing all items: ' + (error?.message || 'unknown error'));
      } finally {
        this.actionLoading = false;
      }
    },

    // === Quick List Methods ===
    async saveQuickItem() {
      this.quickActionLoading = true;
      try {
        if (this.editMode && this.editingQuickItem) {
          // Update existing quick item
          await this.apiCall(`${CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS}/${this.editingQuickItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(this.editingQuickItem)
          });
          this.showSuccessMessage('Quick item updated successfully!');
        } else {
          // Add new quick item
          await this.apiCall(CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS, {
            method: 'POST',
            body: JSON.stringify(this.newQuickItem)
          });
          this.showSuccessMessage('Quick item added successfully!');
        }

        await this.$parent.loadShoppingQuickItems();
        this.cancelEdit();
        this.newQuickItem = { name: '', category: 'General', defaultQuantity: '', defaultNotes: '', defaultStore: '' };
      } catch (error) {
        console.error('Error saving quick item:', error);
        alert('Error saving quick item: ' + (error?.message || 'unknown error'));
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
        await this.$parent.loadShoppingItems();
        this.showSuccessMessage('Item added to shopping list!');
      } catch (error) {
        console.error('Error adding quick item to list:', error);
        alert('Error adding item to list: ' + (error?.message || 'unknown error'));
      } finally {
        this.quickActionLoading = false;
      }
    },

    async removeQuickItem(quickItemId) {
      if (!confirm('Are you sure you want to remove this quick item?')) return;
      try {
        await this.apiCall(`${CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS}/${quickItemId}`, {
          method: 'DELETE'
        });
        await this.$parent.loadShoppingQuickItems();
      } catch (error) {
        console.error('Error removing quick item:', error);
        alert('Error removing quick item: ' + (error?.message || 'unknown error'));
      }
    },

    async initializeQuickItems() {
      this.quickLoading = true;
      try {
        await this.apiCall(CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS_INITIALIZE, {
          method: 'POST'
        });
        await this.$parent.loadShoppingQuickItems();
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
        await this.$parent.loadStores();
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
        await this.$parent.loadStores();
      } catch (error) {
        console.error('Error removing store:', error);
        alert('Error removing store: ' + (error?.message || 'unknown error'));
      }
    },

    // === View Mode Methods ===
    toggleViewMode() {
      this.viewMode = this.viewMode === 'byStore' ? 'flat' : 'byStore';
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

    async checkAndClearCompletedStores() {
      const storesToClear = [];

      // Check each store to see if all items are completed
      Object.keys(this.itemsByStore).forEach(storeName => {
        const items = this.itemsByStore[storeName];
        const allCompleted = items.length > 0 && items.every(item => item.completed);

        if (allCompleted) {
          storesToClear.push(storeName);
        }
      });

      // Clear completed items for stores that are fully completed
      for (const storeName of storesToClear) {
        try {
          // Get all completed items for this store and remove them
          const completedItems = this.shoppingItems.filter(item =>
            (item.store || 'No Store Selected') === storeName && item.completed
          );

          for (const item of completedItems) {
            await this.apiCall(`${CONFIG.API.ENDPOINTS.SHOPPING_ITEMS}/${item.id}`, {
              method: 'DELETE'
            });
          }

          console.log(`Cleared ${completedItems.length} completed items from store: ${storeName}`);
        } catch (error) {
          console.error(`Error clearing completed items from store ${storeName}:`, error);
        }
      }

      // If any stores were cleared, reload the shopping items
      if (storesToClear.length > 0) {
        await this.$parent.loadShoppingItems();
      }
    }
  }
});

// Export component for manual registration
window.ShoppingPageComponent = ShoppingPage; 
