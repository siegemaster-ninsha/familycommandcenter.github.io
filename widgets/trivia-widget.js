/**
 * Trivia Widget
 *
 * Displays trivia questions from Open Trivia Database API
 * Features: questions, answers, categories, auto-refresh
 *
 * API: https://opentdb.com/api_config.php
 * - Free, no API key needed
 * - Multiple choice and true/false questions
 * - Categories and difficulty levels
 * - Session tokens to avoid duplicates
 */

// Widget Metadata
const TriviaWidgetMetadata = window.WidgetTypes.createWidgetMetadata({
  id: 'trivia',
  name: 'Trivia Challenge',
  description: 'Test your knowledge with trivia questions',
  icon: 'help-circle',
  category: 'entertainment',

  defaultSize: { w: 4, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 12, h: 4 },

  configurable: true,
  refreshable: true,
  refreshInterval: 300000, // 5 minutes

  permissions: [],
  requiresAuth: false,
  requiredStores: [],

  features: {
    exportData: false,
    print: false,
    fullscreen: false,
    notifications: false
  }
});

// Widget Settings Schema
TriviaWidgetMetadata.settings = {
  schema: {
    category: {
      type: 'select',
      label: 'Category',
      description: 'Choose a trivia category',
      required: false,
      default: '',
      options: [
        { value: '', label: 'Any Category' },
        { value: '9', label: 'General Knowledge' },
        { value: '10', label: 'Entertainment: Books' },
        { value: '11', label: 'Entertainment: Film' },
        { value: '12', label: 'Entertainment: Music' },
        { value: '13', label: 'Entertainment: Musicals & Theatres' },
        { value: '14', label: 'Entertainment: Television' },
        { value: '15', label: 'Entertainment: Video Games' },
        { value: '16', label: 'Entertainment: Board Games' },
        { value: '17', label: 'Science & Nature' },
        { value: '18', label: 'Science: Computers' },
        { value: '19', label: 'Science: Mathematics' },
        { value: '20', label: 'Mythology' },
        { value: '21', label: 'Sports' },
        { value: '22', label: 'Geography' },
        { value: '23', label: 'History' },
        { value: '24', label: 'Politics' },
        { value: '25', label: 'Art' },
        { value: '26', label: 'Celebrities' },
        { value: '27', label: 'Animals' },
        { value: '28', label: 'Vehicles' },
        { value: '29', label: 'Entertainment: Comics' },
        { value: '30', label: 'Science: Gadgets' },
        { value: '31', label: 'Entertainment: Japanese Anime & Manga' },
        { value: '32', label: 'Entertainment: Cartoon & Animations' }
      ]
    },
    difficulty: {
      type: 'select',
      label: 'Difficulty',
      description: 'Choose question difficulty',
      required: false,
      default: '',
      options: [
        { value: '', label: 'Any Difficulty' },
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' }
      ]
    },
    questionType: {
      type: 'select',
      label: 'Question Type',
      description: 'Multiple choice or true/false',
      required: false,
      default: '',
      options: [
        { value: '', label: 'Any Type' },
        { value: 'multiple', label: 'Multiple Choice' },
        { value: 'boolean', label: 'True / False' }
      ]
    },
    autoReveal: {
      type: 'boolean',
      label: 'Auto-Reveal Answer',
      description: 'Automatically show answer after 10 seconds',
      required: false,
      default: false,
      toggleLabel: 'Auto-reveal'
    }
  }
};

// Trivia Widget Component
const TriviaWidget = {
  name: 'TriviaWidget',

  mixins: [WidgetBase],

  data() {
    return {
      metadata: TriviaWidgetMetadata,

      // Current question
      currentQuestion: null,
      shuffledAnswers: [],

      // Explicit answer selection
      selectedAnswer: null,

      // UI state
      showAnswer: false,
      autoRevealTimer: null,

      // Session token for avoiding duplicates
      sessionToken: null,

      // Question history
      answeredQuestions: [],

      // Rate limiting
      lastApiCall: 0,
      apiCallDelay: 1000,
      maxRetries: 3,

      // Mock questions for fallback
      mockQuestions: [
        {
          category: 'General Knowledge',
          type: 'multiple',
          difficulty: 'easy',
          question: 'What is the capital of France?',
          correct_answer: 'Paris',
          incorrect_answers: ['London', 'Berlin', 'Madrid']
        },
        {
          category: 'Science',
          type: 'boolean',
          difficulty: 'medium',
          question: 'The Earth is flat.',
          correct_answer: 'False',
          incorrect_answers: []
        },
        {
          category: 'Entertainment',
          type: 'multiple',
          difficulty: 'hard',
          question: 'Which actor played the Joker in The Dark Knight?',
          correct_answer: 'Heath Ledger',
          incorrect_answers: ['Joaquin Phoenix', 'Jack Nicholson', 'Jared Leto']
        }
      ]
    };
  },

  computed: {
    // Get category from settings
    selectedCategory() {
      const category = this.settings.category;
      return (typeof category === 'object') ? category?.value || '' : category || '';
    },

    // Get difficulty from settings
    selectedDifficulty() {
      const difficulty = this.settings.difficulty;
      return (typeof difficulty === 'object') ? difficulty?.value || '' : difficulty || '';
    },

    // Get question type from settings
    selectedQuestionType() {
      const questionType = this.settings.questionType;
      return (typeof questionType === 'object') ? questionType?.value || '' : questionType || '';
    },

    // Auto-reveal enabled?
    autoReveal() {
      const autoReveal = this.settings.autoReveal;
      return (typeof autoReveal === 'object') ? autoReveal?.value || false : autoReveal || false;
    },

    // Has question to display
    hasQuestion() {
      return this.currentQuestion !== null;
    },

    // All possible answers (for multiple choice)
    allAnswers() {
      // Return cached shuffled answers to prevent re-shuffling on re-render
      return this.shuffledAnswers;
    },

    // Correct answer
    correctAnswer() {
      return this.currentQuestion?.correct_answer || '';
    },

    // Question category
    questionCategory() {
      return this.currentQuestion?.category || '';
    },

    // Question difficulty
    questionDifficulty() {
      return this.currentQuestion?.difficulty || '';
    },

    // Question type
    questionType() {
      return this.currentQuestion?.type || '';
    },

    // Check if currently rate limited
    isRateLimited() {
      return this.apiCallDelay > 1000; // Consider rate limited if delay > 1 second
    }
  },

  mounted() {
    // Initialize session token & load first question
    this.initializeSessionToken();
    this.loadRandomQuestion();

    // Debug: Track focus events
    this.$nextTick(() => {
      setTimeout(() => {
        const buttons = this.$el.querySelectorAll('.answer-option');
        console.log('🔍 Mounted - Active element:', document.activeElement);
        console.log('🔍 Answer buttons:', buttons.length);
        buttons.forEach((btn, idx) => {
          if (document.activeElement === btn) {
            console.log(`🔍 Button ${idx} (${btn.textContent.trim()}) IS FOCUSED!`);
          }
          btn.addEventListener('focus', () => {
            console.log(`🔍 FOCUS EVENT on button ${idx}: ${btn.textContent.trim()}`);
            console.trace('Focus stack trace');
          });
        });
      }, 100);
    });
  },

  beforeUnmount() {
    if (this.autoRevealTimer) clearTimeout(this.autoRevealTimer);
  },

  watch: {
    // Intentionally no-op to avoid unintended refreshes
    settings: {
      handler() {},
      deep: true
    }
  },

  methods: {
    // Required: Implement onRefresh
    async onRefresh() {
      await this.loadRandomQuestion();
    },

    async initializeSessionToken() {
      try {
        const response = await fetch('https://opentdb.com/api_token.php?command=request');
        const data = await response.json();
        if (data.response_code === 0) {
          this.sessionToken = data.token;
        }
      } catch {
        // Continue without a token
      }
    },

    // Core: ensure state is reset before/after fetch
    async loadRandomQuestion() {
      // rate limiting
      const now = Date.now();
      const delta = now - this.lastApiCall;
      if (delta < this.apiCallDelay) {
        await new Promise(r => setTimeout(r, this.apiCallDelay - delta));
      }
      this.lastApiCall = Date.now();

      try {
        let apiUrl = 'https://opentdb.com/api.php?amount=1';
        if (this.selectedCategory) apiUrl += `&category=${this.selectedCategory}`;
        if (this.selectedDifficulty) apiUrl += `&difficulty=${this.selectedDifficulty}`;
        if (this.selectedQuestionType) apiUrl += `&type=${this.selectedQuestionType}`;
        if (this.sessionToken) apiUrl += `&token=${this.sessionToken}`;

        const resp = await fetch(apiUrl);
        if (!resp.ok) {
          if (resp.status === 429) {
            // Exponential backoff for rate limiting
            this.apiCallDelay = Math.min(this.apiCallDelay * 2, 30000);
            console.warn(`Rate limited by trivia API. Waiting ${this.apiCallDelay}ms before retry.`);
            await new Promise(resolve => setTimeout(resolve, this.apiCallDelay));
            return this.loadRandomQuestion();
          }
          throw new Error(`HTTP ${resp.status}`);
        }

        const data = await resp.json();

        if (data.response_code === 0 && data.results.length > 0) {
          const raw = data.results[0];
          const q = {
            category: this.decodeHtmlEntities(raw.category),
            type: raw.type,
            difficulty: raw.difficulty,
            question: this.decodeHtmlEntities(raw.question),
            correct_answer: this.decodeHtmlEntities(raw.correct_answer),
            incorrect_answers: raw.incorrect_answers.map(a => this.decodeHtmlEntities(a))
          };

          // Reset view state for the new question
          this.currentQuestion = q;
          this.showAnswer = false;
          this.selectedAnswer = null;

          this.shuffleAnswers();
          this.apiCallDelay = 1000;
          this.setupAutoReveal();
        } else if (data.response_code === 4) {
          await this.resetSessionToken();
          await this.loadRandomQuestion();
        } else {
          this.loadMockQuestion();
        }
      } catch {
        this.loadMockQuestion();
      }
    },

    loadMockQuestion() {
      const idx = Math.floor(Math.random() * this.mockQuestions.length);
      this.currentQuestion = this.mockQuestions[idx];
      this.showAnswer = false;
      this.selectedAnswer = null;
      this.shuffleAnswers();
      this.setupAutoReveal();
    },

    shuffleAnswers() {
      if (!this.currentQuestion) {
        this.shuffledAnswers = [];
        return;
      }
      const answers = [...(this.currentQuestion.incorrect_answers || [])];
      const correctIndex = Math.floor(Math.random() * (answers.length + 1));
      answers.splice(correctIndex, 0, this.currentQuestion.correct_answer);

      // NOTE: keys will be unique per question using question text + index
      this.shuffledAnswers = answers;
    },

    // Decode HTML entities in API response
    decodeHtmlEntities(text) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    },

    setupAutoReveal() {
      if (this.autoRevealTimer) clearTimeout(this.autoRevealTimer);
      if (this.autoReveal) {
        this.autoRevealTimer = setTimeout(() => {
          this.revealAnswer();
        }, 10000);
      }
    },

    // New: explicit selection model
    choose(answer) {
      if (this.showAnswer) return; // lock selection once revealed
      this.selectedAnswer = answer;
    },

    revealAnswer() {
      this.showAnswer = true;
      if (this.autoRevealTimer) {
        clearTimeout(this.autoRevealTimer);
        this.autoRevealTimer = null;
      }

      // Set up auto-advance to next question after 7 seconds
      if (this.autoReveal) {
        this.autoRevealTimer = setTimeout(() => {
          this.nextQuestion();
        }, 7000);
      }

      // Track history with correctness based on explicit selection
      if (this.currentQuestion) {
        this.answeredQuestions.unshift({
          ...this.currentQuestion,
          answeredAt: new Date().toISOString(),
          wasCorrect:
            this.selectedAnswer == null
              ? null
              : this.selectedAnswer === this.correctAnswer
        });
        if (this.answeredQuestions.length > 10) {
          this.answeredQuestions = this.answeredQuestions.slice(0, 10);
        }
      }
    },

    nextQuestion() {
      // Clear any existing auto-advance timer
      if (this.autoRevealTimer) {
        clearTimeout(this.autoRevealTimer);
        this.autoRevealTimer = null;
      }
      this.loadRandomQuestion();
    },

    async resetSessionToken() {
      if (!this.sessionToken) return;
      const now = Date.now();
      const delta = now - this.lastApiCall;
      if (delta < this.apiCallDelay) {
        await new Promise(r => setTimeout(r, this.apiCallDelay - delta));
      }
      this.lastApiCall = Date.now();
      try {
        await fetch(`https://opentdb.com/api_token.php?command=reset&token=${this.sessionToken}`);
      } catch {}
    },

    formatCategory(category) {
      return category.replace(/^(Entertainment|Science):\s/, '');
    },
    formatDifficulty(difficulty) {
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    },
    formatQuestionType(type) {
      return type === 'boolean' ? 'True/False' : 'Multiple Choice';
    }
  },

  template: `
    <div class="widget-container trivia-widget">
      <!-- Widget Header -->
      <div class="widget-header">
        <h3 class="widget-title">
          <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon(metadata.icon, 'lucide', 20, 'mr-2') : ''"></div>
          {{ metadata.name }}
          <span v-if="questionCategory" class="text-xs text-gray-600 ml-2">
            ({{ formatCategory(questionCategory) }})
          </span>
        </h3>
        <div class="widget-actions">
          <button
            v-if="editable"
            @click="configure"
            class="widget-action-btn"
            title="Configure"
          >
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('settings', 'lucide', 16, '') : ''"></div>
          </button>
          <button
            v-if="refreshable"
            @click="refresh"
            class="widget-action-btn"
            title="Next Question"
            :disabled="loading"
          >
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('shuffle', 'lucide', 16, '') : ''"></div>
          </button>
        </div>
      </div>

      <!-- Rate Limiting Indicator -->
      <div v-if="isRateLimited" class="rate-limit-indicator">
        <div class="rate-limit-badge">
          <span>⏱️ Rate Limited</span>
          <small>Waiting {{ Math.round(apiCallDelay / 1000) }}s</small>
        </div>
      </div>

      <!-- Widget Body -->
      <div class="widget-body trivia-body">
        <!-- Question Display -->
        <div v-if="hasQuestion" class="trivia-content">
          <!-- Question Card -->
          <div class="question-card">
            <!-- Question Info -->
            <div class="question-info">
              <span class="question-category">{{ formatCategory(questionCategory) }}</span>
              <span class="question-difficulty" :class="questionDifficulty">
                {{ formatDifficulty(questionDifficulty) }}
              </span>
              <span class="question-type">{{ formatQuestionType(questionType) }}</span>
            </div>

            <!-- Question Text -->
            <div class="question-text">
              {{ currentQuestion.question }}
            </div>

            <!-- Multiple Choice Answers -->
            <div v-if="questionType === 'multiple'" class="answer-options">
              <button
                v-for="(answer, idx) in allAnswers"
                :key="(currentQuestion?.question || '') + '::' + idx"
                type="button"
                class="answer-option"
                tabindex="-1"
                :class="{
                  'selected': !showAnswer && selectedAnswer === answer,
                  'correct': showAnswer && answer === correctAnswer,
                  'incorrect': showAnswer && answer !== correctAnswer
                }"
                @click="choose(answer)"
                @mousedown.prevent
                :aria-pressed="(!showAnswer && selectedAnswer === answer) ? 'true' : 'false'"
              >
                {{ answer }}
              </button>
            </div>

            <!-- True/False -->
            <div v-else-if="questionType === 'boolean'" class="answer-options">
              <button
                v-for="(answer, idx) in (['True','False'])"
                :key="(currentQuestion?.question || '') + '::bool::' + idx"
                type="button"
                class="answer-option"
                tabindex="-1"
                :class="{
                  'selected': !showAnswer && selectedAnswer === answer,
                  'correct': showAnswer && answer === correctAnswer,
                  'incorrect': showAnswer && answer !== correctAnswer
                }"
                @click="choose(answer)"
                @mousedown.prevent
                :aria-pressed="(!showAnswer && selectedAnswer === answer) ? 'true' : 'false'"
              >
                {{ answer }}
              </button>
            </div>

            <div v-if="showAnswer" class="answer-section">
              <div class="correct-answer">
                <strong>Correct Answer:</strong> {{ correctAnswer }}
                <span v-if="selectedAnswer != null">
                  — You {{ selectedAnswer === correctAnswer ? 'got it right.' : 'chose: ' + selectedAnswer + '.' }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="trivia-actions">
              <button
                v-if="!showAnswer"
                @click="revealAnswer"
                class="btn btn-primary"
              >
                Reveal Answer
              </button>
              <button
                v-else
                @click="nextQuestion"
                class="btn btn-secondary"
              >
                Next Question
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else-if="loading" class="text-center py-8">
          <div class="loading-spinner"></div>
          <p class="text-sm text-gray-600 mt-2">Loading trivia...</p>
        </div>

        <!-- Error/No Data State -->
        <div v-else class="text-center py-8">
          <div class="text-4xl mb-2">❓</div>
          <p class="text-sm text-gray-600 mb-4">No question available</p>
          <button @click="loadRandomQuestion" class="btn btn-sm btn-primary">
            Load Question
          </button>
        </div>
      </div>
    </div>
  `
};

// Register widget
if (typeof window !== 'undefined' && window.widgetRegistry) {
  window.widgetRegistry.register(TriviaWidgetMetadata, TriviaWidget);
  console.log('✅ Trivia Widget registered');
}

// Export for use
window.TriviaWidget = TriviaWidget;
window.TriviaWidgetMetadata = TriviaWidgetMetadata;

