// Earnings Summary Widget
// Shows total and individual family earnings

// Widget Metadata
const EarningsSummaryMetadata = window.WidgetTypes.createWidgetMetadata({
  id: 'earnings-summary',
  name: 'Earnings Summary',
  description: 'Display family earnings and completion statistics',
  icon: 'dollarSign',
  category: 'family',
  
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 1, h: 1 },
  maxSize: { w: 4, h: 3 },
  
  configurable: true,
  refreshable: true,
  refreshInterval: 30000, // 30 seconds
  
  permissions: [],
  requiresAuth: true,
  requiredStores: ['family'],
  
  features: {
    exportData: true,
    print: false,
    fullscreen: false,
    notifications: false
  }
});

// Widget Settings Schema
EarningsSummaryMetadata.settings = {
  schema: {
    showDetails: {
      type: 'boolean',
      label: 'Show Details',
      description: 'Show individual family member earnings',
      required: false,
      default: true,
      toggleLabel: 'Show individual earnings'
    },
    compactView: {
      type: 'boolean',
      label: 'Compact View',
      description: 'Use condensed layout',
      required: false,
      default: false,
      toggleLabel: 'Use compact layout'
    },
    individualsOnly: {
      type: 'boolean',
      label: 'Individuals Only',
      description: 'Hide total summary, show only individuals',
      required: false,
      default: false,
      toggleLabel: 'Show only individuals'
    }
  }
};

// Widget Component
const EarningsSummaryWidget = {
  name: 'EarningsSummaryWidget',
  
  // Include base widget mixin
  mixins: [WidgetBase],
  
  setup() {
    const familyStore = useFamilyStore();
    return { familyStore };
  },
  
  data() {
    return {
      // Make metadata accessible to template
      metadata: EarningsSummaryMetadata,
      // Use mock data if real data unavailable
      useMockData: false,
      mockMembers: [
        { id: '1', name: 'Alice', earnings: 25.50, completedChores: 8 },
        { id: '2', name: 'Bob', earnings: 18.75, completedChores: 6 },
        { id: '3', name: 'Charlie', earnings: 12.00, completedChores: 4 }
      ]
    };
  },
  
  computed: {
    showDetails() {
      return this.settings.showDetails !== false;
    },
    
    compactView() {
      return this.settings.compactView === true;
    },
    
    individualsOnly() {
      return this.settings.individualsOnly === true;
    },
    
    totalEarnings() {
      if (this.useMockData) {
        return this.mockMembers.reduce((sum, m) => sum + m.earnings, 0);
      }
      return this.familyStore.totalEarnings;
    },
    
    totalChoresCompleted() {
      if (this.useMockData) {
        return this.mockMembers.reduce((sum, m) => sum + m.completedChores, 0);
      }
      return this.familyStore.totalCompletedChores;
    },
    
    members() {
      if (this.useMockData) {
        return this.mockMembers;
      }
      return this.familyStore.enabledMembers.filter(m => 
        (m.earnings > 0 || m.completedChores > 0)
      );
    },
    
    hasMemberData() {
      return this.members.length > 0;
    }
  },
  
  methods: {
    // Required: Implement onRefresh
    async onRefresh() {
      try {
        await this.familyStore.loadMembers();
        // If we got data, disable mock mode
        if (this.familyStore.members.length > 0) {
          this.useMockData = false;
        } else {
          // No real data, use mock data
          this.useMockData = true;
        }
      } catch (error) {
        // If API fails (CORS, not logged in, etc), use mock data for demo
        console.log('Could not load family data, using mock data for demo:', error.message);
        this.useMockData = true;
      }
    },
    
    formatCurrency(amount) {
      return `$${(amount || 0).toFixed(2)}`;
    },
    
    handleExportData() {
      const data = {
        totalEarnings: this.totalEarnings,
        totalChoresCompleted: this.totalChoresCompleted,
        members: this.members.map(m => ({
          name: m.name,
          earnings: m.earnings,
          choresCompleted: m.completedChores
        })),
        exportedAt: new Date().toISOString()
      };
      
      // create downloadable JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `earnings-summary-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.notify('Earnings data exported', 'success');
    }
  },
  
  template: `
    <div class="widget-container earnings-summary-widget" :class="{ 'compact': compactView }">
      <!-- Widget Header -->
      <div class="widget-header">
        <h3 class="widget-title">
          {{ metadata.name }}
          <span v-if="useMockData" class="text-xs text-gray-500 ml-2">(Demo Data)</span>
        </h3>
        <div class="widget-actions">
          <button
            v-if="editable"
            @click="configure"
            class="widget-action-btn"
            title="Configure"
          >
            ⚙️
          </button>
          <button
            v-if="refreshable"
            @click="refresh"
            class="widget-action-btn"
            title="Refresh"
            :disabled="loading"
          >
            🔄
          </button>
          <button
            v-if="metadata.features.exportData"
            @click="handleExportData"
            class="widget-action-btn"
            title="Export Data"
          >
            📥
          </button>
          <button
            v-if="editable"
            @click="remove"
            class="widget-action-btn text-red-500"
            title="Remove Widget"
          >
            ✕
          </button>
        </div>
      </div>
      
      <!-- Widget Body -->
      <div class="widget-body">
        <!-- Loading State -->
        <div v-if="loading" class="widget-loading">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p class="text-sm text-gray-500 mt-2">Loading earnings...</p>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="widget-error">
          <p class="text-red-600">{{ error }}</p>
          <button @click="refresh" class="btn-sm btn-secondary mt-2">
            Retry
          </button>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="!hasMemberData" class="widget-empty">
          <p class="text-gray-500">No earnings data yet</p>
        </div>
        
        <!-- Content -->
        <div v-else class="widget-content space-y-4">
          <!-- Total Summary (unless individualsOnly) -->
          <div v-if="!individualsOnly" class="earnings-summary-total p-4 bg-primary-50 dark:bg-primary-900 rounded-lg">
            <div class="text-sm text-gray-600 dark:text-gray-300">Total Family Earnings</div>
            <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {{ formatCurrency(totalEarnings) }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {{ totalChoresCompleted }} chore{{ totalChoresCompleted !== 1 ? 's' : '' }} completed
            </div>
          </div>
          
          <!-- Individual Earnings (if showDetails) -->
          <div v-if="showDetails && members.length > 0" class="earnings-individuals space-y-2">
            <h4 v-if="!individualsOnly" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Individual Earnings
            </h4>
            <div
              v-for="member in members"
              :key="member.id"
              class="earnings-member flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded"
              :class="{ 'p-2': compactView }"
            >
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-gray-100">
                  {{ member.name }}
                </div>
                <div v-if="!compactView" class="text-xs text-gray-500">
                  {{ member.completedChores || 0 }} chore{{ member.completedChores !== 1 ? 's' : '' }}
                </div>
              </div>
              <div class="text-right">
                <div class="font-bold text-primary-600 dark:text-primary-400">
                  {{ formatCurrency(member.earnings) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Last Refresh Time -->
        <div v-if="lastRefresh && !loading" class="text-xs text-gray-400 mt-2 text-right">
          Updated {{ formatTime(lastRefresh) }}
        </div>
      </div>
    </div>
  `
};

// Register widget
if (typeof window !== 'undefined' && window.widgetRegistry) {
  window.widgetRegistry.register(EarningsSummaryMetadata, EarningsSummaryWidget);
  console.log('✅ Earnings Summary Widget registered');
}

