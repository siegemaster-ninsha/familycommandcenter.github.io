/**
 * Calendar Panels for Chore Page
 * 
 * Two embedded calendar views:
 * 1. TodayCalendarPanel - Shows today's events
 * 2. WeekCalendarPanel - Shows the full week
 * 
 * Supports multiple calendars with color coding.
 */

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

// Shared calendar data fetching mixin
const CalendarMixin = {
  data() {
    return {
      events: [],
      calendars: [],
      configured: false,
      loading: true,
      error: null
    };
  },
  
  methods: {
    async fetchCalendarData(startDate, endDate) {
      this.loading = true;
      this.error = null;
      
      try {
        const configResponse = await this.fetchApi('/calendar/config');
        this.configured = configResponse.configured;
        this.calendars = configResponse.calendars || [];
        
        if (!this.configured) {
          this.events = [];
          return;
        }
        
        const eventsResponse = await this.fetchApi(
          `/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );
        
        this.events = eventsResponse.events || [];
        this.calendars = eventsResponse.calendars || [];
      } catch (err) {
        console.error('Calendar fetch error:', err);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchApi(path) {
      const baseUrl = window.CONFIG?.API?.BASE_URL || '';
      
      // Use authService for auth header (same pattern as other components)
      const authHeader = window.authService?.getAuthHeader?.();
      // Get accountId from apiService (set during app initialization)
      const accountId = window.apiService?.accountId;
      
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
    
    formatTime(event) {
      if (event.allDay) return 'All day';
      const start = new Date(event.start);
      return start.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    },
    
    getCalendarColor(calendarId) {
      const index = this.calendars.findIndex(c => c.id === calendarId);
      return CALENDAR_COLORS[index % CALENDAR_COLORS.length];
    },
    
    getIcon(name, size = 16) {
      return window.Helpers?.IconLibrary?.getIcon?.(name, 'lucide', size) || '';
    }
  }
};

// Today's Events Panel
const TodayCalendarPanel = {
  name: 'TodayCalendarPanel',
  mixins: [CalendarMixin],
  
  template: `
    <div class="calendar-panel calendar-panel--today">
      <div class="calendar-panel-header">
        <h3 class="calendar-panel-title">
          <span v-html="getIcon('calendar', 18)"></span>
          Today
        </h3>
        <span class="calendar-panel-date">{{ formattedDate }}</span>
      </div>
      
      <div class="calendar-panel-body">
        <div v-if="loading" class="calendar-panel-loading">
          <sl-spinner></sl-spinner>
        </div>
        
        <div v-else-if="!configured" class="calendar-panel-empty">
          <span v-html="getIcon('calendar-x', 32)"></span>
          <p>No calendar linked</p>
        </div>
        
        <div v-else-if="todayEvents.length === 0" class="calendar-panel-empty">
          <span v-html="getIcon('calendar-check', 32)"></span>
          <p>No events today</p>
        </div>
        
        <div v-else class="calendar-panel-events">
          <div 
            v-for="event in todayEvents" 
            :key="event.id"
            class="calendar-event"
            :class="{ 'calendar-event--allday': event.allDay }"
          >
            <span class="calendar-color-dot" :style="{ background: getCalendarColor(event.calendarId) }"></span>
            <span class="calendar-event-time">{{ formatTime(event) }}</span>
            <span class="calendar-event-title">{{ event.title }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  
  computed: {
    formattedDate() {
      return new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    },
    
    todayEvents() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return this.events.filter(e => {
        const eventDate = new Date(e.start);
        return eventDate >= today && eventDate < tomorrow;
      });
    }
  },
  
  mounted() {
    this.loadTodayEvents();
  },
  
  methods: {
    async loadTodayEvents() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await this.fetchCalendarData(today, tomorrow);
    }
  }
};

// Week Calendar Panel
const WeekCalendarPanel = {
  name: 'WeekCalendarPanel',
  mixins: [CalendarMixin],
  
  template: `
    <div class="calendar-panel calendar-panel--week">
      <div class="calendar-panel-header">
        <h3 class="calendar-panel-title">
          <span v-html="getIcon('calendar-days', 18)"></span>
          This Week
        </h3>
        <div v-if="calendars.length > 1" class="calendar-legend">
          <span 
            v-for="cal in calendars" 
            :key="cal.id" 
            class="calendar-legend-item"
            :title="cal.name"
          >
            <span class="calendar-color-dot" :style="{ background: getCalendarColor(cal.id) }"></span>
          </span>
        </div>
      </div>
      
      <div class="calendar-panel-body">
        <div v-if="loading" class="calendar-panel-loading">
          <sl-spinner></sl-spinner>
        </div>
        
        <div v-else-if="!configured" class="calendar-panel-empty">
          <span v-html="getIcon('calendar-x', 32)"></span>
          <p>No calendar linked</p>
          <p class="calendar-panel-hint">Parents can add calendars in Settings</p>
        </div>
        
        <div v-else-if="events.length === 0" class="calendar-panel-empty">
          <span v-html="getIcon('calendar-check', 32)"></span>
          <p>No events this week</p>
        </div>
        
        <div v-else class="calendar-week-view">
          <div 
            v-for="day in weekDays" 
            :key="day.key"
            class="calendar-day"
            :class="{ 'calendar-day--today': day.isToday }"
          >
            <div class="calendar-day-header">
              <span class="calendar-day-name">{{ day.dayName }}</span>
              <span class="calendar-day-date">{{ day.dateNum }}</span>
            </div>
            <div class="calendar-day-events">
              <div 
                v-for="event in day.events" 
                :key="event.id"
                class="calendar-event calendar-event--compact"
                :class="{ 'calendar-event--allday': event.allDay }"
                :title="event.title + (event.calendarName ? ' (' + event.calendarName + ')' : '')"
              >
                <span class="calendar-color-dot" :style="{ background: getCalendarColor(event.calendarId) }"></span>
                <span class="calendar-event-title">{{ event.title }}</span>
              </div>
              <div v-if="day.events.length === 0" class="calendar-day-empty">—</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  
  computed: {
    weekDays() {
      const days = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        const dayStart = new Date(date);
        const dayEnd = new Date(date);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const dayEvents = this.events.filter(e => {
          const eventDate = new Date(e.start);
          return eventDate >= dayStart && eventDate < dayEnd;
        });
        
        days.push({
          key: date.toISOString(),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dateNum: date.getDate(),
          isToday: i === 0,
          events: dayEvents
        });
      }
      
      return days;
    }
  },
  
  mounted() {
    this.loadWeekEvents();
  },
  
  methods: {
    async loadWeekEvents() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      await this.fetchCalendarData(today, weekEnd);
    }
  }
};

// Export components
window.TodayCalendarPanel = TodayCalendarPanel;
window.WeekCalendarPanel = WeekCalendarPanel;

console.log('✅ Calendar panels registered');
