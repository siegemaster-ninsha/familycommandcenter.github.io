// Scoundrel Game Store
// Manages game state for the Scoundrel solitaire card game
// A dungeon crawler played with a standard deck of cards

// Local storage key for persisting high scores
const SCOUNDREL_STORAGE_KEY = 'fcc_scoundrel_high_scores';

// Game constants
const STARTING_HEALTH = 20;
const ROOM_SIZE = 4;
const CARDS_TO_PLAY = 3;

// Card suits
const SUITS = {
  SPADES: 'spades',
  CLUBS: 'clubs',
  DIAMONDS: 'diamonds',
  HEARTS: 'hearts'
};

// Card values (2-14, where J=11, Q=12, K=13, A=14)
const CARD_VALUES = {
  2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
  J: 11, Q: 12, K: 13, A: 14
};

const VALUE_DISPLAY = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A'
};

/**
 * Create a fresh deck for Scoundrel
 * Removes: Jokers, red face cards (J/Q/K of hearts/diamonds), red aces
 * @returns {Array} Array of card objects
 */
function createDeck() {
  const deck = [];

  // Add all spades (2-A) - Monsters
  for (const [name, value] of Object.entries(CARD_VALUES)) {
    deck.push({
      id: `${SUITS.SPADES}-${name}`,
      suit: SUITS.SPADES,
      value: value,
      display: VALUE_DISPLAY[value] || name,
      type: 'monster'
    });
  }

  // Add all clubs (2-A) - Monsters
  for (const [name, value] of Object.entries(CARD_VALUES)) {
    deck.push({
      id: `${SUITS.CLUBS}-${name}`,
      suit: SUITS.CLUBS,
      value: value,
      display: VALUE_DISPLAY[value] || name,
      type: 'monster'
    });
  }

  // Add diamonds 2-10 only (red face cards removed) - Weapons
  for (const [name, value] of Object.entries(CARD_VALUES)) {
    if (value <= 10) {
      deck.push({
        id: `${SUITS.DIAMONDS}-${name}`,
        suit: SUITS.DIAMONDS,
        value: value,
        display: VALUE_DISPLAY[value] || name,
        type: 'weapon'
      });
    }
  }

  // Add hearts 2-10 only (red face cards removed) - Potions
  for (const [name, value] of Object.entries(CARD_VALUES)) {
    if (value <= 10) {
      deck.push({
        id: `${SUITS.HEARTS}-${name}`,
        suit: SUITS.HEARTS,
        value: value,
        display: VALUE_DISPLAY[value] || name,
        type: 'potion'
      });
    }
  }

  return deck;
}

/**
 * Fisher-Yates shuffle
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array (mutates original)
 */
function shuffleDeck(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const useScoundrelGameStore = Pinia.defineStore('scoundrelGame', {
  state: () => ({
    // Game state
    gameState: 'idle', // 'idle', 'playing', 'won', 'lost'

    // Player stats
    health: STARTING_HEALTH,
    maxHealth: STARTING_HEALTH,

    // Current weapon (null or card object)
    weapon: null,
    // Maximum monster value this weapon can attack (null = unused)
    weaponDurability: null,
    // Monsters defeated by current weapon (for display)
    defeatedByWeapon: [],

    // Deck and room
    deck: [],
    room: [], // Current 4 cards
    cardsPlayedThisRoom: 0,

    // Turn state
    potionUsedThisTurn: false,
    canSkipRoom: true,
    lastSkipped: false,

    // Statistics
    roomsCleared: 0,
    monstersDefeated: 0,
    damageDealt: 0,

    // High scores
    highScores: [],

    // UI state
    selectedCardIndex: null,
    showTutorial: false,
    animatingCard: null,
    lastAction: null // For showing feedback
  }),

  getters: {
    /**
     * Check if game is active
     */
    isPlaying: (state) => state.gameState === 'playing',

    /**
     * Check if game is over (won or lost)
     */
    isGameOver: (state) => state.gameState === 'won' || state.gameState === 'lost',

    /**
     * Get remaining cards in dungeon
     */
    remainingCards: (state) => state.deck.length,

    /**
     * Get cards remaining to play this room
     */
    cardsRemainingThisRoom: (state) => CARDS_TO_PLAY - state.cardsPlayedThisRoom,

    /**
     * Check if player can skip current room
     */
    canSkip: (state) => state.canSkipRoom && !state.lastSkipped && state.cardsPlayedThisRoom === 0,

    /**
     * Check if a weapon can attack a given monster
     */
    canAttackWithWeapon: (state) => (monsterValue) => {
      if (!state.weapon) return false;
      // If weapon hasn't been used yet, it can attack any monster
      if (state.weaponDurability === null) return true;
      // Otherwise, can only attack monsters weaker than durability
      return monsterValue < state.weaponDurability;
    },

    /**
     * Calculate damage from attacking a monster
     */
    calculateDamage: (state) => (monster, useWeapon) => {
      if (useWeapon && state.weapon) {
        // Damage = monster value - weapon value, minimum 0
        return Math.max(0, monster.value - state.weapon.value);
      }
      // Bare-handed: full damage
      return monster.value;
    },

    /**
     * Get current game score
     */
    score: (state) => {
      if (state.gameState === 'won') {
        // Bonus for winning + health remaining + monsters defeated
        return 100 + state.health + (state.monstersDefeated * 2) + state.roomsCleared;
      }
      // Score based on progress
      return state.monstersDefeated + state.roomsCleared;
    }
  },

  actions: {
    /**
     * Start a new game
     */
    startGame() {
      // Create and shuffle deck
      this.deck = shuffleDeck(createDeck());

      // Reset player state
      this.health = STARTING_HEALTH;
      this.maxHealth = STARTING_HEALTH;
      this.weapon = null;
      this.weaponDurability = null;
      this.defeatedByWeapon = [];

      // Reset room state
      this.room = [];
      this.cardsPlayedThisRoom = 0;
      this.potionUsedThisTurn = false;
      this.canSkipRoom = true;
      this.lastSkipped = false;

      // Reset statistics
      this.roomsCleared = 0;
      this.monstersDefeated = 0;
      this.damageDealt = 0;

      // Reset UI
      this.selectedCardIndex = null;
      this.animatingCard = null;
      this.lastAction = null;

      // Set game state and deal first room
      this.gameState = 'playing';
      this.dealRoom();

      console.log('[Scoundrel] New game started with', this.deck.length + this.room.length, 'cards');
    },

    /**
     * Deal cards to fill the room
     */
    dealRoom() {
      // Deal cards until room has 4 cards or deck is empty
      while (this.room.length < ROOM_SIZE && this.deck.length > 0) {
        this.room.push(this.deck.pop());
      }

      // Reset room state
      this.cardsPlayedThisRoom = 0;
      this.potionUsedThisTurn = false;

      // Check for end game conditions
      if (this.room.length === 0) {
        // Dungeon exhausted - player wins!
        this.winGame();
      }

      console.log('[Scoundrel] Room dealt:', this.room.length, 'cards. Deck:', this.deck.length);
    },

    /**
     * Play a card from the room
     * @param {number} cardIndex - Index of card in room array
     * @param {Object} options - Play options (e.g., useWeapon for monsters)
     */
    playCard(cardIndex, options = {}) {
      if (this.gameState !== 'playing') return;
      if (cardIndex < 0 || cardIndex >= this.room.length) return;

      const card = this.room[cardIndex];
      this.animatingCard = card.id;
      this.selectedCardIndex = null;

      let actionResult = null;

      switch (card.type) {
        case 'monster':
          actionResult = this.fightMonster(card, options.useWeapon);
          break;
        case 'weapon':
          actionResult = this.equipWeapon(card);
          break;
        case 'potion':
          actionResult = this.drinkPotion(card);
          break;
      }

      // Remove card from room
      this.room.splice(cardIndex, 1);
      this.cardsPlayedThisRoom++;

      // Store action result for UI feedback
      this.lastAction = actionResult;

      // Check if room is complete
      if (this.cardsPlayedThisRoom >= CARDS_TO_PLAY) {
        this.completeRoom();
      }

      // Reset animation after short delay
      setTimeout(() => {
        this.animatingCard = null;
      }, 300);
    },

    /**
     * Fight a monster
     * @param {Object} monster - Monster card
     * @param {boolean} useWeapon - Whether to use equipped weapon
     * @returns {Object} Action result
     */
    fightMonster(monster, useWeapon = false) {
      let damage;
      let weaponUsed = false;

      if (useWeapon && this.weapon && this.canAttackWithWeapon(monster.value)) {
        // Attack with weapon
        damage = Math.max(0, monster.value - this.weapon.value);

        // Update weapon durability
        this.weaponDurability = monster.value;
        this.defeatedByWeapon.push(monster);
        weaponUsed = true;

        console.log('[Scoundrel] Attacked', monster.display, 'with weapon. Damage:', damage);
      } else {
        // Bare-handed attack
        damage = monster.value;
        console.log('[Scoundrel] Fought', monster.display, 'bare-handed. Damage:', damage);
      }

      // Apply damage
      this.health -= damage;
      this.damageDealt += damage;
      this.monstersDefeated++;

      // Check for death
      if (this.health <= 0) {
        this.health = 0;
        this.loseGame();
      }

      return {
        type: 'fight',
        monster: monster,
        damage: damage,
        weaponUsed: weaponUsed,
        healthAfter: this.health
      };
    },

    /**
     * Equip a weapon
     * @param {Object} weapon - Weapon card
     * @returns {Object} Action result
     */
    equipWeapon(weapon) {
      const oldWeapon = this.weapon;

      // Equip new weapon
      this.weapon = weapon;
      this.weaponDurability = null; // Reset durability (fresh weapon)
      this.defeatedByWeapon = [];

      console.log('[Scoundrel] Equipped weapon:', weapon.display, 'of', weapon.suit);

      return {
        type: 'equip',
        weapon: weapon,
        replacedWeapon: oldWeapon
      };
    },

    /**
     * Drink a health potion
     * @param {Object} potion - Potion card
     * @returns {Object} Action result
     */
    drinkPotion(potion) {
      let healed = 0;
      let wasted = false;

      if (!this.potionUsedThisTurn) {
        // First potion this turn - heals
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + potion.value);
        healed = this.health - oldHealth;
        this.potionUsedThisTurn = true;

        console.log('[Scoundrel] Drank potion for', healed, 'health');
      } else {
        // Additional potions have no effect
        wasted = true;
        console.log('[Scoundrel] Potion wasted (already used one this turn)');
      }

      return {
        type: 'potion',
        potion: potion,
        healed: healed,
        wasted: wasted
      };
    },

    /**
     * Complete the current room and deal next
     */
    completeRoom() {
      this.roomsCleared++;
      this.canSkipRoom = true;
      this.lastSkipped = false;

      console.log('[Scoundrel] Room', this.roomsCleared, 'completed');

      // Keep the remaining card and deal more
      this.dealRoom();
    },

    /**
     * Skip the current room (put all cards at bottom of deck)
     */
    skipRoom() {
      if (!this.canSkip) {
        console.log('[Scoundrel] Cannot skip room');
        return;
      }

      // Put all room cards at bottom of deck
      while (this.room.length > 0) {
        this.deck.unshift(this.room.pop());
      }

      // Mark that we skipped
      this.lastSkipped = true;
      this.canSkipRoom = true;

      console.log('[Scoundrel] Room skipped');

      // Deal new room
      this.dealRoom();

      this.lastAction = { type: 'skip' };
    },

    /**
     * Select a card (for UI interaction)
     * @param {number} index - Card index
     */
    selectCard(index) {
      if (this.selectedCardIndex === index) {
        this.selectedCardIndex = null;
      } else {
        this.selectedCardIndex = index;
      }
    },

    /**
     * Player wins the game
     */
    winGame() {
      this.gameState = 'won';
      console.log('[Scoundrel] Victory! Final health:', this.health);

      // Save high score
      this.saveHighScore();
    },

    /**
     * Player loses the game
     */
    loseGame() {
      this.gameState = 'lost';
      console.log('[Scoundrel] Defeat! Rooms cleared:', this.roomsCleared);

      // Save high score
      this.saveHighScore();
    },

    /**
     * Save current score to high scores
     */
    saveHighScore() {
      const newScore = {
        score: this.score,
        roomsCleared: this.roomsCleared,
        monstersDefeated: this.monstersDefeated,
        healthRemaining: this.health,
        won: this.gameState === 'won',
        date: Date.now()
      };

      this.highScores.push(newScore);
      this.highScores.sort((a, b) => b.score - a.score);
      this.highScores = this.highScores.slice(0, 10); // Keep top 10

      this.saveToStorage();
    },

    /**
     * Load high scores from storage
     */
    loadFromStorage() {
      try {
        const stored = localStorage.getItem(SCOUNDREL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.highScores = parsed;
            console.log('[Scoundrel] Loaded', this.highScores.length, 'high scores');
          }
        }
      } catch (error) {
        console.warn('[Scoundrel] Failed to load high scores:', error);
      }
    },

    /**
     * Save high scores to storage
     */
    saveToStorage() {
      try {
        localStorage.setItem(SCOUNDREL_STORAGE_KEY, JSON.stringify(this.highScores));
      } catch (error) {
        console.warn('[Scoundrel] Failed to save high scores:', error);
      }
    },

    /**
     * Toggle tutorial display
     */
    toggleTutorial() {
      this.showTutorial = !this.showTutorial;
    },

    /**
     * Reset store to initial state
     */
    reset() {
      this.gameState = 'idle';
      this.health = STARTING_HEALTH;
      this.maxHealth = STARTING_HEALTH;
      this.weapon = null;
      this.weaponDurability = null;
      this.defeatedByWeapon = [];
      this.deck = [];
      this.room = [];
      this.cardsPlayedThisRoom = 0;
      this.potionUsedThisTurn = false;
      this.canSkipRoom = true;
      this.lastSkipped = false;
      this.roomsCleared = 0;
      this.monstersDefeated = 0;
      this.damageDealt = 0;
      this.selectedCardIndex = null;
      this.showTutorial = false;
      this.animatingCard = null;
      this.lastAction = null;
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useScoundrelGameStore = useScoundrelGameStore;
  window.SCOUNDREL_SUITS = SUITS;
}
