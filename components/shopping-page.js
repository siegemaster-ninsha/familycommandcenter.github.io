// Shopping Page Component
const ShoppingPage = Vue.defineComponent({
  template: `
    <div class="space-y-6">
      <!-- Shopping List -->
      <div class="bg-white rounded-lg border border-[#e6e9f4] p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em]">🛒 Shopping List</h2>
          <button
            @click="showAddItemModal = true"
            class="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
            Add Item
          </button>
        </div>
        
        <div class="space-y-3">
          <div 
            v-for="(item, index) in shoppingItems" 
            :key="index"
            class="flex items-center gap-3 p-3 border border-[#e6e9f4] rounded-lg hover:bg-gray-50 transition-colors"
          >
            <input 
              type="checkbox" 
              :checked="item.completed"
              @change="toggleItem(index)"
              class="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            >
            <div class="flex-1">
              <span 
                :class="item.completed ? 'line-through text-gray-500' : 'text-[#0d0f1c]'"
                class="font-medium"
              >
                {{ item.name }}
              </span>
              <div class="text-sm text-[#47569e] flex items-center gap-2 mt-1">
                <span v-if="item.category">{{ getCategoryIcon(item.category) }} {{ item.category }}</span>
                <span v-if="item.quantity">• Qty: {{ item.quantity }}</span>
                <span v-if="item.notes">• {{ item.notes }}</span>
              </div>
            </div>
            <button
              @click="removeItem(index)"
              class="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
              title="Remove item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div v-if="shoppingItems.length === 0" class="text-center py-8 text-[#47569e]">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mx-auto mb-3 opacity-50" viewBox="0 0 256 256">
            <path d="M222.14,58.87A8,8,0,0,0,216,56H54.68L49.79,29.14A16,16,0,0,0,34.05,16H16a8,8,0,0,0,0,16H34.05l31.1,180.14A16,16,0,0,0,80.89,224H208a8,8,0,0,0,0-16H80.89L78.18,192H188.1a16,16,0,0,0,15.74-13.14L222.14,58.87ZM188.1,176H75.17l-18.73-108H207.37Z"></path>
          </svg>
          <p>Your shopping list is empty.</p>
          <p class="text-sm mt-1">Click "Add Item" to get started!</p>
        </div>
      </div>

      <!-- Shopping Stats -->
      <div class="bg-white rounded-lg border border-[#e6e9f4] p-6">
        <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">📊 Shopping Stats</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-600 mb-1">
              {{ shoppingItems.length }}
            </div>
            <div class="text-sm text-blue-700">Total Items</div>
          </div>
          
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600 mb-1">
              {{ completedItems }}
            </div>
            <div class="text-sm text-green-700">Completed</div>
          </div>
          
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-orange-600 mb-1">
              {{ pendingItems }}
            </div>
            <div class="text-sm text-orange-700">Pending</div>
          </div>
          
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-600 mb-1">
              {{ completionPercentage }}%
            </div>
            <div class="text-sm text-purple-700">Complete</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-lg border border-[#e6e9f4] p-6">
        <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">⚡ Quick Actions</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            @click="clearCompleted"
            class="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-3 rounded-lg hover:bg-red-200 transition-colors"
            :disabled="completedItems === 0"
            :class="completedItems === 0 ? 'opacity-50 cursor-not-allowed' : ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
            </svg>
            Clear Completed
          </button>
          
          <button
            @click="markAllComplete"
            class="flex items-center justify-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-lg hover:bg-green-200 transition-colors"
            :disabled="pendingItems === 0"
            :class="pendingItems === 0 ? 'opacity-50 cursor-not-allowed' : ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"></path>
            </svg>
            Mark All Complete
          </button>
          
          <button
            @click="clearAll"
            class="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            :disabled="shoppingItems.length === 0"
            :class="shoppingItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"></path>
            </svg>
            Clear All
          </button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      shoppingItems: [
        { name: "Milk", category: "Dairy", quantity: "1 gallon", completed: false, notes: "2% or whole" },
        { name: "Bread", category: "Bakery", quantity: "2 loaves", completed: true, notes: "" },
        { name: "Bananas", category: "Produce", quantity: "1 bunch", completed: false, notes: "Not too ripe" },
        { name: "Chicken Breast", category: "Meat", quantity: "2 lbs", completed: false, notes: "Organic if possible" }
      ],
      showAddItemModal: false
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
    }
  },
  methods: {
    toggleItem(index) {
      this.shoppingItems[index].completed = !this.shoppingItems[index].completed;
    },
    
    removeItem(index) {
      this.shoppingItems.splice(index, 1);
    },
    
    clearCompleted() {
      this.shoppingItems = this.shoppingItems.filter(item => !item.completed);
    },
    
    markAllComplete() {
      this.shoppingItems.forEach(item => item.completed = true);
    },
    
    clearAll() {
      if (confirm('Are you sure you want to clear all items?')) {
        this.shoppingItems = [];
      }
    },
    
    getCategoryIcon(category) {
      const icons = {
        'Dairy': '🥛',
        'Bakery': '🍞',
        'Produce': '🥬',
        'Meat': '🥩',
        'Frozen': '🧊',
        'Pantry': '🥫',
        'Household': '🧹',
        'Personal Care': '🧴'
      };
      return icons[category] || '📦';
    }
  }
});

// Export component for manual registration
window.ShoppingPageComponent = ShoppingPage; 