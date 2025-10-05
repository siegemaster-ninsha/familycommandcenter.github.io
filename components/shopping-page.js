// Shopping Page Component
const ShoppingPage = Vue.defineComponent({
  template: `
    <div class="space-y-6 pb-24 sm:pb-0">
      <!-- Shopping List -->
      <div class="w-full">
        <div class="w-full block rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <!-- Header with title and buttons -->
          <div class="mb-6 sm:mb-8">
            <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974a1.125 1.125 0 0 1 1.119 1.257Z" />
              </svg>
              Shopping List
            </h2>
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-2">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                </svg>
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
            <div class="space-y-1">
              <div
                v-for="item in category.items"
                :key="item.id"
                class="flex items-center gap-4 p-4 sm:p-4 rounded-lg transition-colors cursor-pointer"
                :class="[
                  item.isToggling ? 'opacity-75 pointer-events-none' : '',
                  item.completed ? 'opacity-75' : ''
                ]"
                style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);"
                @click="handleToggleItem(item.id)"
              >
                <div class="relative">
                  <input
                    type="checkbox"
                    :checked="item.completed"
                    @change="handleToggleItem(item.id)"
                    @click.stop
                    :disabled="item.isToggling"
                    class="w-10 h-10 rounded focus:ring-success-600 focus:ring-2 focus:ring-offset-2 touch-target text-success-600 transition-all duration-200 transform"
                    :class="item.completed ? 'scale-110' : 'scale-100'"
                  >
                  <div
                    v-if="item.isToggling"
                    class="absolute inset-0 flex items-center justify-center"
                  >
                    <div class="w-5 h-5 border-2 border-success-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                <div class="flex-1">
                  <span
                    :class="[
                      'font-medium text-lg sm:text-base block',
                      item.completed ? 'line-through text-white opacity-60' : 'text-white'
                    ]"
                  >
                    {{ item.name }}
                  </span>
                  <div v-if="item.quantity" class="text-sm sm:text-base text-white text-opacity-90 mt-1">
                    <span class="font-medium">Qty: {{ item.quantity }}</span>
                  </div>
                  <div class="text-sm sm:text-base text-white text-opacity-90 flex items-center gap-2 mt-1">
                    <span v-if="item.notes">• {{ item.notes }}</span>
                    <span v-if="item.store" class="inline-flex items-center gap-1 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.25A2.25 2.25 0 0 1 0 18.75V10.5a2.25 2.25 0 0 1 1.5-2.122l8.25-3.06a2.25 2.25 0 0 1 1.5 0l8.25 3.06A2.25 2.25 0 0 1 21 10.5v8.25A2.25 2.25 0 0 1 18.75 21H13.5Z" />
                      </svg>
                      {{ item.store }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    @click.stop="startEditItem(item)"
                    class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 touch-target rounded-md"
                    style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 40px; height: 40px;"
                    :class="'hover:scale-105 active:scale-95'"
                    title="Edit item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    @click.stop="removeItem(item.id)"
                    class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 touch-target rounded-md"
                    style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 40px; height: 40px;"
                    :class="'hover:scale-105 active:scale-95'"
                    title="Remove item"
                  >
                    <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 18, 'text-white drop-shadow-sm')"></div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Show message if category is empty -->
            <div v-if="category.items.length === 0" class="text-center py-4 text-secondary-custom text-sm">
              No items in {{ category.name }}
            </div>
          </div>

          <!-- Show message if no items at all -->
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
        <div class="flex items-center justify-between mb-4 sm:mb-6">
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
        
        <!-- Quick items list -->
        <div v-else class="space-y-2">
          <div
            v-for="quickItem in quickItems"
            :key="quickItem.id"
            class="flex items-center gap-4 p-4 sm:p-4 rounded-lg transition-colors cursor-pointer"
            style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);"
            @click="addQuickItemToList(quickItem.id)"
          >
            <!-- Quick item doesn't need checkbox since it's not toggleable -->
            <div class="w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center">
              <!-- Quick add icon instead of checkbox -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-white opacity-60">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>

            <div class="flex-1">
              <span class="font-medium text-lg sm:text-base text-white block">
                {{ quickItem.name }}
              </span>
              <div v-if="quickItem.defaultQuantity" class="text-base sm:text-sm text-white text-opacity-90 mt-1">
                <span class="font-medium">Qty: {{ quickItem.defaultQuantity }}</span>
              </div>
              <div class="text-base sm:text-sm text-white text-opacity-90 flex items-center gap-2 mt-1">
                <span class="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 opacity-90"><path d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm7.53-3.28a.75.75 0 10-1.06 1.06L10.94 12l-2.22 2.22a.75.75 0 101.06 1.06L12 13.06l2.22 2.22a.75.75 0 101.06-1.06L13.06 12l2.22-2.22a.75.75 0 10-1.06-1.06L12 10.94 9.78 8.72z"/></svg>
                  <span>{{ quickItem.category }}</span>
                </span>
                <span v-if="quickItem.defaultNotes">• {{ quickItem.defaultNotes }}</span>
                <span v-if="quickItem.defaultStore" class="inline-flex items-center gap-1 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.25A2.25 2.25 0 0 1 0 18.75V10.5a2.25 2.25 0 0 1 1.5-2.122l8.25-3.06a2.25 2.25 0 0 1 1.5 0l8.25 3.06A2.25 2.25 0 0 1 21 10.5v8.25A2.25 2.25 0 0 1 18.75 21H13.5Z" />
                  </svg>
                  {{ quickItem.defaultStore }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click.stop="startEditQuickItem(quickItem)"
                class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 touch-target rounded-md"
                style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 40px; height: 40px;"
                :class="'hover:scale-105 active:scale-95'"
                title="Edit quick item"
                :disabled="quickActionLoading"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                @click.stop="removeQuickItem(quickItem.id)"
                class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 touch-target rounded-md"
                style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 40px; height: 40px;"
                :class="'hover:scale-105 active:scale-95'"
                title="Remove quick item"
                :disabled="quickActionLoading"
              >
                <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 18, 'text-white drop-shadow-sm')"></div>
              </button>
            </div>
          </div>
          
          <div v-if="quickItems.length === 0" class="text-center py-4 sm:py-8 text-secondary-custom">
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
        
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
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
        <div class="flex items-center justify-between mb-4 sm:mb-6">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.25A2.25 2.25 0 0 1 0 18.75V10.5a2.25 2.25 0 0 1 1.5-2.122l8.25-3.06a2.25 2.25 0 0 1 1.5 0l8.25 3.06A2.25 2.25 0 0 1 21 10.5v8.25A2.25 2.25 0 0 1 18.75 21H13.5Z" />
            </svg>
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
              class="flex items-center justify-center p-2 opacity-70 hover:opacity-100 transition-all duration-200 touch-target rounded-md"
              style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);"
              :class="'hover:scale-105 active:scale-95'"
              title="Remove store"
            >
              <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 12, 'text-white drop-shadow-sm')"></div>
            </button>
          </div>
          
          <div v-if="stores.length === 0" class="col-span-full text-center py-4 text-secondary-custom">
            <p>No stores added yet.</p>
            <p class="text-sm mt-1">Click "Add Store" to get started!</p>
          </div>
        </div>
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

      <!-- Add Store Modal -->
      <div v-if="showAddStoreModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          
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
    completedItems() {
      return this.shoppingItems.filter(item => item.completed).length;
    },
    
    pendingItems() {
      return this.shoppingItems.filter(item => !item.completed).length;
    },
    
    completionPercentage() {
      return this.shoppingItems.length > 0 ? Math.round((this.completedItems / this.shoppingItems.length) * 100) : 0;
    },

    
    // Use injected data with fallback names for template compatibility
    quickItems() {
      return this.shoppingQuickItems;
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
        grouped[category].sort((a, b) => {
          // First, completed items go to bottom
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          // Then sort alphabetically by name
          return a.name.localeCompare(b.name);
        });
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
    // Preloaded data from parent
    'shoppingItems',
    'shoppingQuickItems',
    'stores',
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

    async handleToggleItem(itemId) {
      // Find the item in the local array for optimistic update
      const itemIndex = this.shoppingItems.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        console.error('Item not found:', itemId);
        return;
      }

      // Store the previous state for potential rollback
      const previousState = this.shoppingItems[itemIndex].completed;

      // Set loading state for this specific item
      this.shoppingItems[itemIndex].isToggling = true;

      // Optimistic update - immediately toggle the local state
      this.shoppingItems[itemIndex].completed = !previousState;

      try {
        // Make the API call to persist the change
        const response = await this.apiCall(`${CONFIG.API.ENDPOINTS.SHOPPING_ITEMS}/${itemId}/toggle`, {
          method: 'PUT'
        });

        // Update with server response if it differs from our optimistic update
        if (response && response.item && typeof response.item.completed === 'boolean' && response.item.completed !== this.shoppingItems[itemIndex].completed) {
          this.shoppingItems[itemIndex].completed = response.item.completed;
        }

        // Note: Store clearing functionality removed since we no longer group by store
      } catch (error) {
        console.error('Error toggling item:', error);

        // Rollback the optimistic update on error
        this.shoppingItems[itemIndex].completed = previousState;

        // Show user-friendly error message instead of alert
        this.showErrorMessage('Failed to update item. Please try again.');
      } finally {
        // Remove loading state
        this.shoppingItems[itemIndex].isToggling = false;
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
    }
  }
});

// Export component for manual registration
window.ShoppingPageComponent = ShoppingPage; 
