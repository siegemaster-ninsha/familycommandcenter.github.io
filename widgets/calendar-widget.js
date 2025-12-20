/**
 * Calendar Widget
 * 
 * Displays upcoming events from multiple iCloud/iCal calendar feeds.
 * Calendar URLs are stored securely on backend - not exposed to frontend.
 * 
 * Features:
 * - Multiple calendars with color coding
 * - Week view with upcoming events
 * - All-day vs timed events
 * - Event details on hover/click
 * - Configurable date range
 */

// Widget Metadata
const CalendarWidgetMetadata = window.WidgetTypes.createWidgetMetadata({
  id: 'calendar',
  name: 'Family Calendar',
  description: 'Upcoming events from your family calendars',
  icon: 'calendar',
  category: 'information',
  
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 12, h: 8 },
  
  configurable: true,
  refreshable: true,
  refreshInterval: 300000, // 5 minutes
  
  permissions: [],
  requiresAuth: true,
  requiredStores: ['auth'],
  
  features: {
    exportData: false,
    print: false,
    fullscreen: false,
    notifications: false
  }
});

// Widget Settings Schema
CalendarWidgetMetadata.settings = {
  schema: {
    daysToShow: {
      type: 'select',
      label: 'Days to Show',
      description: 'How many days of events to display',
      required: false,
      default: '7',
      options: [
        { value: '3', label: '3 days' },
        { value: '7', label: '1 week' },
        { value: '14', label: '2 weeks' },
        { value: '30', label: '1 month' }
      ]
    },
    showAllDay: {
      type: 'boolean',
      label: 'Show All-Day Events',
      description: 'Display all-day events',
      required: false,
      default: true,
      toggleLabel: 'Show all-day events'
    },
    compactView: {
      type: 'boolean',
      label: 'Compact View',
      description: 'Use compact layout for more events',
      required: false,
      default: false,
      toggleLabel: 'Compact view'
    }
  }
};

// Calendar colors for multiple calendars
const CALENDAR_COLORS = [
  'var(--color-primary-500)',
  'var(--color-secondary-500)',
  'var(--color-success-500)',
  'var(--color-warning-500)',
  '#e91e63',
  '#9c27b0',
  '#00bcd4',
  '#ff5722'
];

// Calendar Widget Component
const CalendarWidget = {
  name: 'CalendarWidget',
  
  mixins: [window.WidgetBase],
  
  data() {
    return {
      metadata: CalendarWidgetMetadata,
      events: [],
      calendars: [],
      configured: false,
      configuring: false,
      addingCalendar: false,
      newCalendarName: '',
      newCalendarUrl: '',
      configError: null,
      selectedEvent: null
    };
  },
  
  computed: {
    daysToShow() {
      return parseInt(this.config?.settings?.daysToShow || '7', 10);
    },
    
    showAllDay() {
      return this.config?.settings?.showAllDay !== false;
    },
    
    compactView() {
      return this.config?.settings?.compactView === true;
    },
    
    filteredEvents() {
      let events = this.events;
      if (!this.showAllDay) {
        events = events.filter(e => !e.allDay);
      }
      return events;
    },
    
    groupedEvents() {
      const groups = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      this.filteredEvents.forEach(event => {
        const eventDate = new Date(event.start);
        eventDate.setHours(0, 0, 0, 0);
        const key = eventDate.toISOString().split('T')[0];
        
        if (!groups[key]) {
          groups[key] = {
            date: eventDate,
            label: this.formatDateLabel(eventDate, today),
            events: []
          };
        }
        groups[key].events.push(event);
      });
      
      return Object.values(groups).sort((a, b) => a.date - b.date);
    },
    
    hasEvents() {
      return this.filteredEvents.length > 0;
    },
    
    isParent() {
      const authStore = window.Pinia?.useAuthStore?.();
      return authStore?.isParent ?? true;
    }
  },
  
  methods: {
    async onRefresh() {
      try {
        const configResponse = await this.fetchApi('/calendar/config');
        this.configured = configResponse.configured;
        this.calendars = configResponse.calendars || [];
        
        if (!this.configured) {
          this.events = [];
          return;
        }
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + this.daysToShow);
        
        const eventsResponse = await this.fetchApi(
          `/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );
        
        this.events = eventsResponse.events || [];
        this.calendars = eventsResponse.calendars || [];
      } catch (error) {
        console.error('Failed to refresh calendar:', error);
        this.error = error.message;
      }
    },
    
    async fetchApi(path) {
      const baseUrl = window.CONFIG?.API?.BASE_URL || '';
      const authStore = window.Pinia?.useAuthStore?.();
      const token = authStore?.idToken;
      const accountId = authStore?.currentAccountId;
      
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (accountId) headers['X-Account-Id'] = accountId;
      
      const response = await fetch(`${baseUrl}${path}`, { headers });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'API request failed');
      }
      return response.json();
    },
    
    getCalendarColor(calendarId) {
      const index = this.calendars.findIndex(c => c.id === calendarId);
      return CALENDAR_COLORS[index % CALENDAR_COLORS.length];
    },
    
    async saveCalendar() {
      if (!this.newCalendarUrl.trim()) {
        this.configError = 'Please enter a calendar URL';
        return;
      }
      
      this.configError = null;
      this.loading = true;
      
      try {
        const baseUrl = window.CONFIG?.API?.BASE_URL || '';
        const authStore = window.Pinia?.useAuthStore?.();
        const token = authStore?.idToken;
        const accountId = authStore?.currentAccountId;
        
        const response = await fetch(`${baseUrl}/calendar/config`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Account-Id': accountId
          },
          body: JSON.stringify({ 
            calendarUrl: this.newCalendarUrl,
            name: this.newCalendarName || 'Calendar'
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to save calendar');
        }
        
        this.configured = true;
        this.addingCalendar = false;
        this.newCalendarName = '';
        this.newCalendarUrl = '';
        
        await this.onRefresh();
      } catch (error) {
        this.configError = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    async removeCalendar(calendarId) {
      if (!confirm('Remove this calendar?')) return;
      
      try {
        const baseUrl = window.CONFIG?.API?.BASE_URL || '';
        const authStore = window.Pinia?.useAuthStore?.();
        const token = authStore?.idToken;
        const accountId = authStore?.currentAccountId;
        
        await fetch(`${baseUrl}/calendar/config?id=${calendarId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Account-Id': accountId
          }
        });
        
        await this.onRefresh();
      } catch (error) {
        console.error('Failed to remove calendar:', error);
      }
    },
    
    formatDateLabel(date, today) {
      const diff = Math.floor((date - today) / (1000 * 60 * 60 * 24));
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Tomorrow';
      if (diff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    },
    
    formatEventTime(event) {
      if (event.allDay) return 'All day';
      const start = new Date(event.start);
      return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    },
    
    showEventDetails(event) {
      this.selectedEvent = event;
    },
    
    closeEventDetails() {
      this.selectedEvent = null;
    }
  },
  
  template: `
    <div class="widget-container calendar-widget">
      <div class="widget-header">
        <h3 class="widget-title">
          <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon(metadata.icon, 'lucide', 20, 'mr-2') : ''"></span>
          {{ metadata.name }}
          <span v-if="calendars.length > 0" class="text-xs text-gray-500 ml-2">({{ calendars.length }})</span>
        </h3>
        <div class="widget-actions">
          <button v-if="configured && isParent" @click="configuring = !configuring" class="widget-action-btn" title="Manage Calendars">
            <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('settings', 'lucide', 16) : ''"></span>
          </button>
          <button v-if="refreshable && configured" @click="refresh" class="widget-action-btn" title="Refresh" :disabled="loading">
            <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('refresh-cw', 'lucide', 16) : ''"></span>
          </button>
        </div>
      </div>
      
      <div class="widget-body calendar-body">
        <div v-if="loading" class="calendar-loading">
          <div class="loading-spinner"></div>
          <p>Loading calendar...</p>
        </div>
        
        <!-- Calendar Management -->
        <div v-else-if="configuring && isParent" class="calendar-config">
          <div class="config-header">
            <h4>Manage Calendars</h4>
            <button @click="configuring = false" class="btn-close">×</button>
          </div>
          
          <div class="config-body">
            <!-- Existing calendars -->
            <div v-if="calendars.length > 0" class="calendar-list">
              <div v-for="(cal, index) in calendars" :key="cal.id" class="calendar-list-item">
                <span class="calendar-color-dot" :style="{ background: getCalendarColor(cal.id) }"></span>
                <span class="calendar-name">{{ cal.name }}</span>
                <button @click="removeCalendar(cal.id)" class="btn-icon btn-danger" title="Remove">
                  <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('trash', 'lucide', 14) : ''"></span>
                </button>
              </div>
            </div>
            
            <!-- Add new calendar form -->
            <div v-if="addingCalendar" class="add-calendar-form">
              <input v-model="newCalendarName" type="text" placeholder="Calendar name (e.g., Work)" class="config-input mb-2" />
              <input v-model="newCalendarUrl" type="url" placeholder="webcal://..." class="config-input" @keyup.enter="saveCalendar" />
              <div class="flex gap-2 mt-2">
                <button @click="saveCalendar" class="btn btn-primary btn-sm" :disabled="loading">Add</button>
                <button @click="addingCalendar = false" class="btn btn-secondary btn-sm">Cancel</button>
              </div>
              <p v-if="configError" class="config-error">{{ configError }}</p>
            </div>
            
            <button v-else @click="addingCalendar = true" class="btn btn-primary btn-sm mt-4">
              <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('plus', 'lucide', 14) : ''"></span>
              Add Calendar
            </button>
          </div>
        </div>
        
        <!-- Not Configured -->
        <div v-else-if="!configured" class="calendar-empty">
          <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('calendar-x', 'lucide', 48, 'text-gray-400') : ''"></span>
          <p>No calendars configured</p>
          <button v-if="isParent" @click="configuring = true; addingCalendar = true" class="btn btn-primary btn-sm">Add Calendar</button>
          <p v-else class="text-sm text-gray-500 mt-2">Ask a parent to set up calendars</p>
        </div>
        
        <!-- Events List -->
        <div v-else-if="hasEvents" class="calendar-events" :class="{ 'compact': compactView }">
          <div v-for="group in groupedEvents" :key="group.date.toISOString()" class="event-group">
            <div class="event-date-header">{{ group.label }}</div>
            <div v-for="event in group.events" :key="event.id" class="event-item" :class="{ 'all-day': event.allDay }" @click="showEventDetails(event)">
              <span class="calendar-color-dot" :style="{ background: getCalendarColor(event.calendarId) }"></span>
              <span class="event-time">{{ formatEventTime(event) }}</span>
              <span class="event-title">{{ event.title }}</span>
            </div>
          </div>
        </div>
        
        <!-- No Events -->
        <div v-else class="calendar-empty">
          <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('calendar-check', 'lucide', 48, 'text-gray-400') : ''"></span>
          <p>No upcoming events</p>
        </div>
        
        <!-- Event Details Modal -->
        <div v-if="selectedEvent" class="event-modal-overlay" @click.self="closeEventDetails">
          <div class="event-modal">
            <div class="event-modal-header">
              <h4>{{ selectedEvent.title }}</h4>
              <button @click="closeEventDetails" class="btn-close">×</button>
            </div>
            <div class="event-modal-body">
              <div class="event-detail">
                <span class="calendar-color-dot" :style="{ background: getCalendarColor(selectedEvent.calendarId) }"></span>
                <span>{{ selectedEvent.calendarName }}</span>
              </div>
              <div class="event-detail">
                <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('clock', 'lucide', 16) : ''"></span>
                <span>{{ formatEventTime(selectedEvent) }}</span>
              </div>
              <div v-if="selectedEvent.location" class="event-detail">
                <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('map-pin', 'lucide', 16) : ''"></span>
                <span>{{ selectedEvent.location }}</span>
              </div>
              <div v-if="selectedEvent.description" class="event-description">{{ selectedEvent.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

// Register widget
if (typeof window !== 'undefined' && window.widgetRegistry) {
  window.widgetRegistry.register(CalendarWidgetMetadata, CalendarWidget);
  console.log('✅ Calendar Widget registered');
}

window.CalendarWidget = CalendarWidget;
window.CalendarWidgetMetadata = CalendarWidgetMetadata;
