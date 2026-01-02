// Habit Card Component
// Displays a single habit with a pip grid showing completion history
// Supports compact (7 days) and expanded (full month) views
// **Feature: habit-tracking**
// **Validates: Requirements 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2**

const HabitCard = Vue.defineComponent({
  name: 'HabitCard',
  
  props: {
    // Habit object { id, name, memberId }
    habit: {
      type: Object,
      required: true
    },
    // Array of completion date strings (YYYY-MM-DD)
    completions: {
      type: Array,
      default: () => []
    },
    // Whether the pip grid is expanded to month view
    isGridExpanded: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['toggle-day', 'toggle-grid-view', 'edit', 'delete'],
  
  template: `
    <div 
      class="habit-card" 
      :class="{ 'habit-card--grid-expanded': isGridExpanded }"
    >
      <!-- Card Header: Name + Actions -->
      <div class="habit-card-header">
        <span class="habit-card-name">{{ habit.name }}</span>
        <div class="habit-card-actions">
          <!-- Expand/Collapse Grid Button -->
          <!-- **Validates: Requirements 3.2, 3.3** -->
          <button 
            @click="handleToggleGridView"
            class="habit-card-action-btn"
            :title="isGridExpanded ? 'Show week' : 'Show month'"
            :aria-label="isGridExpanded ? 'Collapse to week view' : 'Expand to month view'"
            aria-pressed="false"
          >
            <span v-html="getIcon(isGridExpanded ? 'chevron-up' : 'calendar')"></span>
          </button>
          
          <!-- Edit Button -->
          <button 
            @click="handleEdit"
            class="habit-card-action-btn"
            title="Edit habit"
            aria-label="Edit habit"
          >
            <span v-html="getIcon('pencil')"></span>
          </button>
          
          <!-- Delete Button -->
          <button 
            @click="handleDelete"
            class="habit-card-action-btn habit-card-action-btn--danger"
            title="Delete habit"
            aria-label="Delete habit"
          >
            <span v-html="getIcon('trash-2')"></span>
          </button>
        </div>
      </div>
      
      <!-- Compact View: 7 days in a row -->
      <!-- **Validates: Requirements 3.1, 3.6** -->
      <div v-if="!isGridExpanded" class="habit-pip-grid habit-pip-grid--week">
        <div 
          v-for="day in last7Days" 
          :key="day.date"
          class="habit-pip"
          :class="getPipClasses(day.date)"
          @click="handleToggleDay(day.date)"
          :title="formatDateTitle(day.date)"
          role="checkbox"
          :aria-checked="isCompletedOnDate(day.date)"
          :aria-label="getAriaLabel(day.date)"
          tabindex="0"
          @keydown.enter="handleToggleDay(day.date)"
          @keydown.space.prevent="handleToggleDay(day.date)"
        >
          <span class="habit-pip-day-label">{{ day.dayLabel }}</span>
        </div>
      </div>
      
      <!-- Expanded View: Full month calendar grid -->
      <!-- **Validates: Requirements 3.2, 3.8** -->
      <div v-else class="habit-pip-grid habit-pip-grid--month">
        <div class="habit-month-header">
          <span class="habit-month-name">{{ currentMonthName }}</span>
        </div>
        
        <!-- Day of week headers -->
        <div class="habit-month-weekdays">
          <span v-for="day in weekdayLabels" :key="day" class="habit-weekday-label">{{ day }}</span>
        </div>
        
        <!-- Calendar grid -->
        <div class="habit-month-grid">
          <div 
            v-for="day in currentMonthDays" 
            :key="day.date"
            class="habit-pip habit-pip--month"
            :class="getMonthPipClasses(day)"
            @click="handleMonthDayClick(day)"
            :title="formatDateTitle(day.date)"
            :role="day.isFuture ? 'presentation' : 'checkbox'"
            :aria-checked="day.isFuture ? undefined : isCompletedOnDate(day.date)"
            :aria-label="day.isFuture ? undefined : getAriaLabel(day.date)"
            :tabindex="day.isFuture || !day.isCurrentMonth ? -1 : 0"
            @keydown.enter="handleMonthDayClick(day)"
            @keydown.space.prevent="handleMonthDayClick(day)"
          >
            <span class="habit-pip-day">{{ day.dayOfMonth }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  
  computed: {
    /**
     * Get the last 7 days for compact view
     * **Validates: Requirements 3.1, 3.6**
     * @returns {Array<{date: string, dayLabel: string}>}
     */
    last7Days() {
      const days = [];
      const today = new Date();
      
      // Start from 6 days ago to today (oldest to newest)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        days.push({
          date: this.formatDateISO(date),
          dayLabel: this.getDayLabel(date)
        });
      }
      
      return days;
    },
    
    /**
     * Get the current month name
     * @returns {string}
     */
    currentMonthName() {
      const today = new Date();
      return today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    },
    
    /**
     * Get weekday labels for month view header
     * @returns {string[]}
     */
    weekdayLabels() {
      return ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    },
    
    /**
     * Get all days for the current month calendar grid
     * Includes padding days from previous/next months
     * **Validates: Requirements 3.2, 3.8**
     * @returns {Array<{date: string, dayOfMonth: number, isCurrentMonth: boolean, isFuture: boolean}>}
     */
    currentMonthDays() {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      
      // First day of the month
      const firstDay = new Date(year, month, 1);
      // Last day of the month
      const lastDay = new Date(year, month + 1, 0);
      
      // Day of week for first day (0 = Sunday)
      const startDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      // Add padding days from previous month
      const prevMonth = new Date(year, month, 0);
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonth.getDate() - i);
        days.push({
          date: this.formatDateISO(date),
          dayOfMonth: date.getDate(),
          isCurrentMonth: false,
          isFuture: false
        });
      }
      
      // Add days of current month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const isFuture = date > today;
        
        days.push({
          date: this.formatDateISO(date),
          dayOfMonth: day,
          isCurrentMonth: true,
          isFuture
        });
      }
      
      // Add padding days from next month to complete the grid (6 rows max)
      const remainingDays = 42 - days.length; // 6 rows * 7 days
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
          date: this.formatDateISO(date),
          dayOfMonth: i,
          isCurrentMonth: false,
          isFuture: true
        });
      }
      
      return days;
    },
    
    /**
     * Get today's date in ISO format
     * @returns {string}
     */
    todayISO() {
      return this.formatDateISO(new Date());
    }
  },
  
  methods: {
    /**
     * Get icon HTML using the Helpers library
     * @param {string} iconName - Icon name
     * @param {number} size - Icon size in pixels
     * @returns {string} HTML string
     */
    getIcon(iconName, size = 16) {
      if (typeof window.Helpers !== 'undefined' && window.Helpers.IconLibrary) {
        return window.Helpers.IconLibrary.getIcon(iconName, 'lucide', size, '');
      }
      return '';
    },
    
    /**
     * Format a Date object to ISO date string (YYYY-MM-DD)
     * @param {Date} date
     * @returns {string}
     */
    formatDateISO(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    /**
     * Get short day label (e.g., "M", "T", "W")
     * @param {Date} date
     * @returns {string}
     */
    getDayLabel(date) {
      return date.toLocaleDateString(undefined, { weekday: 'narrow' });
    },
    
    /**
     * Format date for tooltip title
     * @param {string} dateStr - ISO date string
     * @returns {string}
     */
    formatDateTitle(dateStr) {
      const date = new Date(dateStr + 'T00:00:00');
      const completed = this.isCompletedOnDate(dateStr);
      const status = completed ? 'Completed' : 'Not completed';
      return `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} - ${status}`;
    },
    
    /**
     * Get aria label for a pip
     * @param {string} dateStr - ISO date string
     * @returns {string}
     */
    getAriaLabel(dateStr) {
      const date = new Date(dateStr + 'T00:00:00');
      const completed = this.isCompletedOnDate(dateStr);
      const status = completed ? 'completed' : 'not completed';
      return `${this.habit.name} on ${date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}, ${status}`;
    },
    
    /**
     * Check if habit is completed on a specific date
     * **Validates: Requirements 3.4, 3.5**
     * @param {string} dateStr - ISO date string
     * @returns {boolean}
     */
    isCompletedOnDate(dateStr) {
      return this.completions.includes(dateStr);
    },
    
    /**
     * Check if a date is today
     * @param {string} dateStr - ISO date string
     * @returns {boolean}
     */
    isToday(dateStr) {
      return dateStr === this.todayISO;
    },
    
    /**
     * Get CSS classes for a pip in compact view
     * **Validates: Requirements 3.4, 3.5, 3.7**
     * @param {string} dateStr - ISO date string
     * @returns {object}
     */
    getPipClasses(dateStr) {
      return {
        'habit-pip--filled': this.isCompletedOnDate(dateStr),
        'habit-pip--today': this.isToday(dateStr)
      };
    },
    
    /**
     * Get CSS classes for a pip in month view
     * **Validates: Requirements 3.4, 3.5, 3.7, 3.8**
     * @param {object} day - Day object
     * @returns {object}
     */
    getMonthPipClasses(day) {
      return {
        'habit-pip--filled': this.isCompletedOnDate(day.date),
        'habit-pip--today': this.isToday(day.date),
        'habit-pip--future': day.isFuture,
        'habit-pip--other-month': !day.isCurrentMonth
      };
    },
    
    /**
     * Handle toggling a day's completion status
     * **Validates: Requirements 4.1, 4.2**
     * @param {string} dateStr - ISO date string
     */
    handleToggleDay(dateStr) {
      this.$emit('toggle-day', this.habit.id, dateStr);
    },
    
    /**
     * Handle clicking a day in month view
     * Prevents toggling future dates
     * **Validates: Requirements 3.8**
     * @param {object} day - Day object
     */
    handleMonthDayClick(day) {
      // Don't allow toggling future dates or other month dates
      if (day.isFuture || !day.isCurrentMonth) {
        return;
      }
      this.handleToggleDay(day.date);
    },
    
    /**
     * Handle toggling grid view between compact and expanded
     * **Validates: Requirements 3.2, 3.3**
     */
    handleToggleGridView() {
      this.$emit('toggle-grid-view', this.habit.id);
    },
    
    /**
     * Handle edit button click
     */
    handleEdit() {
      this.$emit('edit', this.habit);
    },
    
    /**
     * Handle delete button click
     */
    handleDelete() {
      this.$emit('delete', this.habit);
    }
  }
});

// Register component globally
if (typeof window !== 'undefined') {
  window.HabitCard = HabitCard;
}
