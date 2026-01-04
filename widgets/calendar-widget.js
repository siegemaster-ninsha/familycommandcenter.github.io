/**
 * Calendar Widget
 * 
 * Displays upcoming events from multiple iCloud/iCal calendar feeds.
 * Calendar URLs are stored securely on backend - not exposed to frontend.
 * 
 * Features:
 * - Multiple calendars with color coding
 * - List view with upcoming events
 * - Full month grid view with day selection
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
    },
    defaultView: {
      type: 'select',
      label: 'Default View',
      description: 'Which view to show by default',
      required: false,
      default: 'list',
      options: [
        { value: 'list', label: 'List View' },
        { value: 'month', label: 'Month View' }
      ]
    }
  }
};

// Calendar colors for multiple calendars (prefixed to avoid collision with calendar-panels.js)
const WIDGET_CALENDAR_COLORS = [
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
      selectedEvent: null,
      selectedDate: null,
      viewMode: 'list', // 'list' or 'month'
      currentMonth: new Date(),
      _hasFetched: false
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
    
    defaultView() {
      return this.config?.settings?.defaultView || 'list';
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
    },
    
    // Watch for accountId from auth store (more reliable than $root)
    rootAccountId() {
      const authStore = window.useAuthStore?.();
      return authStore?.accountId || null;
    },
    
    // Month view computed properties
    currentMonthLabel() {
      return this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    },
    
    calendarDays() {
      const year = this.currentMonth.getFullYear();
      const month = this.currentMonth.getMonth();
      
      // First day of the month
      const firstDay = new Date(year, month, 1);
      // Last day of the month
      const lastDay = new Date(year, month + 1, 0);
      
      // Start from Sunday of the week containing the first day
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      // End on Saturday of the week containing the last day
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
      
      const days = [];
      const current = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      while (current <= endDate) {
        const dateKey = current.toISOString().split('T')[0];
        const dayEvents = this.getEventsForDate(current);
        
        days.push({
          date: new Date(current),
          day: current.getDate(),
          isCurrentMonth: current.getMonth() === month,
          isToday: current.getTime() === today.getTime(),
          hasEvents: dayEvents.length > 0,
          eventCount: dayEvents.length,
          events: dayEvents.slice(0, 3) // Show max 3 event indicators
        });
        
        current.setDate(current.getDate() + 1);
      }
      
      return days;
    },
    
    selectedDateEvents() {
      if (!this.selectedDate) return [];
      return this.getEventsForDate(this.selectedDate);
    },
    
    selectedDateLabel() {
      if (!this.selectedDate) return '';
      return this.selectedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  },
  
  watch: {
    // When accountId becomes available, fetch calendar data
    rootAccountId: {
      immediate: true,
      handler(newVal) {
        if (newVal && !this._hasFetched) {
          console.log('CalendarWidget: accountId now available, fetching data...');
          this._hasFetched = true;
          this.onRefresh();
        }
      }
    },
    
    // Set initial view mode from settings
    defaultView: {
      immediate: true,
      handler(newVal) {
        if (newVal && !this._viewModeSet) {
          this.viewMode = newVal;
          this._viewModeSet = true;
        }
      }
    }
  },
  
  methods: {
    async onRefresh() {
      // Wait for auth to be ready before making API calls
      const authHeader = window.authService?.getAuthHeader?.();
      const authStore = window.useAuthStore?.();
      const accountId = authStore?.accountId;
      
      if (!authHeader || !accountId) {
        console.log('CalendarWidget: Waiting for auth...', { hasAuth: !!authHeader, hasAccountId: !!accountId });
        return;
      }
      
      try {
        const configResponse = await this.fetchApi('/calendar/config');
        this.configured = configResponse.configured;
        this.calendars = configResponse.calendars || [];
        
        if (!this.configured) {
          this.events = [];
          return;
        }
        
        // Fetch events for a wider range to support month view
        const startDate = new Date();
        startDate.setDate(1);
        startDate.setMonth(startDate.getMonth() - 1); // Include previous month
        
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 2); // Include next month
        endDate.setDate(0); // Last day of next month
        
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
      // Use centralized apiService for consistent auth/accountId handling
      if (window.apiService) {
        return window.apiService.get(path);
      }
      
      // Fallback to manual fetch if apiService not available
      const baseUrl = window.CONFIG?.API?.BASE_URL || '';
      const authHeader = window.authService?.getAuthHeader?.();
      const authStore = window.useAuthStore?.();
      const accountId = authStore?.accountId;
      
      const headers = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;
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
      return WIDGET_CALENDAR_COLORS[index % WIDGET_CALENDAR_COLORS.length];
    },
    
    async saveCalendar() {
      if (!this.newCalendarUrl.trim()) {
        this.configError = 'Please enter a calendar URL';
        return;
      }
      
      this.configError = null;
      this.loading = true;
      
      try {
        // Use centralized apiService for consistent auth/accountId handling
        await window.apiService.put('/calendar/config', { 
          calendarUrl: this.newCalendarUrl,
          name: this.newCalendarName || 'Calendar'
        });
        
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
        // Use centralized apiService for consistent auth/accountId handling
        await window.apiService.delete(`/calendar/config?id=${calendarId}`);
        
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
    },
    
    // View toggle methods
    toggleView() {
      this.viewMode = this.viewMode === 'list' ? 'month' : 'list';
      this.selectedDate = null;
    },
    
    // Month navigation
    previousMonth() {
      const newMonth = new Date(this.currentMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      this.currentMonth = newMonth;
      this.selectedDate = null;
    },
    
    nextMonth() {
      const newMonth = new Date(this.currentMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      this.currentMonth = newMonth;
      this.selectedDate = null;
    },
    
    goToToday() {
      this.currentMonth = new Date();
      this.selectedDate = new Date();
      this.selectedDate.setHours(0, 0, 0, 0);
    },
    
    // Day selection
    selectDay(day) {
      if (day.isCurrentMonth) {
        this.selectedDate = new Date(day.date);
      }
    },
    
    // Get events for a specific date
    getEventsForDate(date) {
      const dateKey = date.toISOString().split('T')[0];
      return this.filteredEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toISOString().split('T')[0] === dateKey;
      });
    },
    
    closeDayEvents() {
      this.selectedDate = null;
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
          <!-- View Toggle -->
          <button v-if="configured" @click="toggleView" class="widget-action-btn view-toggle-btn" :title="viewMode === 'list' ? 'Month View' : 'List View'">
            <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon(viewMode === 'list' ? 'calendar-days' : 'list', 'lucide', 16) : ''"></span>
          </button>
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
        
        <!-- Month View -->
        <div v-else-if="viewMode === 'month'" class="calendar-month-view">
          <!-- Month Navigation -->
          <div class="month-nav">
            <button @click="previousMonth" class="month-nav-btn" title="Previous Month">
              <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('chevron-left', 'lucide', 18) : ''"></span>
            </button>
            <span class="month-label">{{ currentMonthLabel }}</span>
            <button @click="nextMonth" class="month-nav-btn" title="Next Month">
              <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('chevron-right', 'lucide', 18) : ''"></span>
            </button>
            <button @click="goToToday" class="today-btn" title="Go to Today">Today</button>
          </div>
          
          <!-- Day Headers -->
          <div class="calendar-grid-header">
            <div class="day-header">Sun</div>
            <div class="day-header">Mon</div>
            <div class="day-header">Tue</div>
            <div class="day-header">Wed</div>
            <div class="day-header">Thu</div>
            <div class="day-header">Fri</div>
            <div class="day-header">Sat</div>
          </div>
          
          <!-- Calendar Grid -->
          <div class="calendar-grid">
            <div 
              v-for="(day, index) in calendarDays" 
              :key="index"
              class="calendar-day"
              :class="{
                'other-month': !day.isCurrentMonth,
                'today': day.isToday,
                'has-events': day.hasEvents,
                'selected': selectedDate && day.date.getTime() === selectedDate.getTime()
              }"
              @click="selectDay(day)"
            >
              <span class="day-number">{{ day.day }}</span>
              <div v-if="day.hasEvents" class="event-dots">
                <span 
                  v-for="(event, i) in day.events" 
                  :key="i" 
                  class="event-dot"
                  :style="{ background: getCalendarColor(event.calendarId) }"
                ></span>
                <span v-if="day.eventCount > 3" class="more-events">+{{ day.eventCount - 3 }}</span>
              </div>
            </div>
          </div>
          
          <!-- Selected Day Events Panel -->
          <div v-if="selectedDate" class="day-events-panel">
            <div class="day-events-header">
              <h4>{{ selectedDateLabel }}</h4>
              <button @click="closeDayEvents" class="btn-close">×</button>
            </div>
            <div class="day-events-list">
              <div v-if="selectedDateEvents.length === 0" class="no-events">
                <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('calendar-check', 'lucide', 24, 'text-gray-400') : ''"></span>
                <p>No events</p>
              </div>
              <div 
                v-for="event in selectedDateEvents" 
                :key="event.id" 
                class="event-item"
                :class="{ 'all-day': event.allDay }"
                @click="showEventDetails(event)"
              >
                <span class="calendar-color-dot" :style="{ background: getCalendarColor(event.calendarId) }"></span>
                <span class="event-time">{{ formatEventTime(event) }}</span>
                <span class="event-title">{{ event.title }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- List View (existing) -->
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
