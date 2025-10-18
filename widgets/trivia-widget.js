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
  maxSize: { w: 8, h: 4 },

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

      // UI state
      showAnswer: false,
      autoRevealTimer: null,

      // Session token for avoiding duplicates
      sessionToken: null,

      // Question history
      answeredQuestions: [],

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
      return this.config?.settings?.category || '';
    },

    // Get difficulty from settings
    selectedDifficulty() {
      return this.config?.settings?.difficulty || '';
    },

    // Get question type from settings
    selectedQuestionType() {
      return this.config?.settings?.questionType || '';
    },

    // Auto-reveal enabled?
    autoReveal() {
      return this.config?.settings?.autoReveal || false;
    },

    // Has question to display
    hasQuestion() {
      return this.currentQuestion !== null;
    },

    // All possible answers (for multiple choice)
    allAnswers() {
      if (!this.currentQuestion) return [];

      const answers = [...(this.currentQuestion.incorrect_answers || [])];
      const correctIndex = Math.floor(Math.random() * (answers.length + 1));
      answers.splice(correctIndex, 0, this.currentQuestion.correct_answer);

      return answers;
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
    }
  },

  mounted() {
    // Initialize session token
    this.initializeSessionToken();

    // Load first question
    this.loadRandomQuestion();
  },

  beforeUnmount() {
    // Clean up auto-reveal timer
    if (this.autoRevealTimer) {
      clearTimeout(this.autoRevealTimer);
    }
  },

  methods: {
    // Required: Implement onRefresh
    async onRefresh() {
      await this.loadRandomQuestion();
    },

    // Initialize session token to avoid duplicate questions
    async initializeSessionToken() {
      try {
        const response = await fetch('https://opentdb.com/api_token.php?command=request');
        const data = await response.json();

        if (data.response_code === 0) {
          this.sessionToken = data.token;
          console.log('✅ Trivia session token initialized');
        }
      } catch (error) {
        console.warn('Failed to initialize trivia session token:', error);
        // Continue without session token
      }
    },

    // Load random trivia question from API
    async loadRandomQuestion() {
      try {
        // Build API URL with parameters
        let apiUrl = 'https://opentdb.com/api.php?amount=1';

        if (this.selectedCategory) {
          apiUrl += `&category=${this.selectedCategory}`;
        }

        if (this.selectedDifficulty) {
          apiUrl += `&difficulty=${this.selectedDifficulty}`;
        }

        if (this.selectedQuestionType) {
          apiUrl += `&type=${this.selectedQuestionType}`;
        }

        if (this.sessionToken) {
          apiUrl += `&token=${this.sessionToken}`;
        }

        console.log('Loading trivia question from:', apiUrl);
        const response = await response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch trivia question');
        }

        const data = await response.json();

        if (data.response_code === 0 && data.results.length > 0) {
          // Decode HTML entities in question and answers
          const question = this.decodeHtmlEntities(data.results[0]);
          this.currentQuestion = question;
          this.showAnswer = false;

          // Set up auto-reveal if enabled
          this.setupAutoReveal();

          console.log('✅ New trivia question loaded');
        } else if (data.response_code === 4) {
          // Token exhausted, reset it
          await this.resetSessionToken();
          await this.loadRandomQuestion(); // Retry
        } else {
          // Use mock data as fallback
          this.loadMockQuestion();
        }
      } catch (error) {
        console.error('Trivia API failed, using mock data:', error);
        this.loadMockQuestion();
      }
    },

    // Load mock question for fallback
    loadMockQuestion() {
      const randomIndex = Math.floor(Math.random() * this.mockQuestions.length);
      this.currentQuestion = this.mockQuestions[randomIndex];
      this.showAnswer = false;
      this.setupAutoReveal();
    },

    // Decode HTML entities in API response
    decodeHtmlEntities(text) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    },

    // Set up auto-reveal timer
    setupAutoReveal() {
      if (this.autoRevealTimer) {
        clearTimeout(this.autoRevealTimer);
      }

      if (this.autoReveal) {
        this.autoRevealTimer = setTimeout(() => {
          this.showAnswer = true;
        }, 10000); // 10 seconds
      }
    },

    // Reveal the answer
    revealAnswer() {
      this.showAnswer = true;

      // Clear auto-reveal timer
      if (this.autoRevealTimer) {
        clearTimeout(this.autoRevealTimer);
        this.autoRevealTimer = null;
      }

      // Add to answered questions
      if (this.currentQuestion) {
        this.answeredQuestions.unshift({
          ...this.currentQuestion,
          answeredAt: new Date().toISOString(),
          wasCorrect: null // Could implement scoring later
        });

        // Keep only last 10 answered questions
        if (this.answeredQuestions.length > 10) {
          this.answeredQuestions = this.answeredQuestions.slice(0, 10);
        }
      }
    },

    // Load next question
    nextQuestion() {
      this.loadRandomQuestion();
    },

    // Reset session token
    async resetSessionToken() {
      if (!this.sessionToken) return;

      try {
        await fetch(`https://opentdb.com/api_token.php?command=reset&token=${this.sessionToken}`);
        console.log('✅ Trivia session token reset');
      } catch (error) {
        console.warn('Failed to reset trivia session token:', error);
      }
    },

    // Format category name for display
    formatCategory(category) {
      return category.replace(/^(Entertainment|Science):\s/, '');
    },

    // Format difficulty for display
    formatDifficulty(difficulty) {
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    },

    // Format question type for display
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
              <div
                v-for="(answer, index) in allAnswers"
                :key="index"
                class="answer-option"
                :class="{
                  'correct': showAnswer && answer === correctAnswer,
                  'incorrect': showAnswer && answer !== correctAnswer && allAnswers.indexOf(answer) !== allAnswers.indexOf(correctAnswer)
                }"
              >
                {{ answer }}
              </div>
            </div>

            <!-- Answer Section -->
            <div v-if="showAnswer" class="answer-section">
              <div class="correct-answer">
                <strong>Correct Answer:</strong> {{ correctAnswer }}
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

