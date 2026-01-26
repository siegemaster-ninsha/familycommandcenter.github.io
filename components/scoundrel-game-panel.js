// Scoundrel Game Panel Component
// Canvas-based card game UI for the Scoundrel dungeon crawler

const ScoundrelGamePanel = Vue.defineComponent({
  name: 'ScoundrelGamePanel',

  setup() {
    const store = window.useScoundrelGameStore?.();
    return { store };
  },

  data() {
    return {
      // Canvas dimensions
      canvasWidth: 800,
      canvasHeight: 600,

      // Card dimensions
      cardWidth: 80,
      cardHeight: 120,
      cardGap: 20,

      // Animation state
      hoverCardIndex: null,

      // Colors
      colors: {
        background: '#1a472a', // Casino green
        cardBack: '#1e3a5f',
        cardFront: '#ffffff',
        hearts: '#e63946',
        diamonds: '#e63946',
        spades: '#1d3557',
        clubs: '#1d3557',
        gold: '#ffd700',
        healthBar: '#4ade80',
        healthBarBg: '#374151',
        damageFlash: '#ef4444'
      },

      // Resize observer
      resizeObserver: null
    };
  },

  computed: {
    gameState() {
      return this.store?.gameState || 'idle';
    },
    isPlaying() {
      return this.store?.isPlaying || false;
    },
    isGameOver() {
      return this.store?.isGameOver || false;
    },
    health() {
      return this.store?.health || 0;
    },
    maxHealth() {
      return this.store?.maxHealth || 20;
    },
    weapon() {
      return this.store?.weapon || null;
    },
    weaponDurability() {
      return this.store?.weaponDurability;
    },
    room() {
      return this.store?.room || [];
    },
    remainingCards() {
      return this.store?.remainingCards || 0;
    },
    roomsCleared() {
      return this.store?.roomsCleared || 0;
    },
    selectedCardIndex() {
      return this.store?.selectedCardIndex;
    },
    canSkip() {
      return this.store?.canSkip || false;
    },
    cardsRemainingThisRoom() {
      return this.store?.cardsRemainingThisRoom || 0;
    },
    score() {
      return this.store?.score || 0;
    },
    showTutorial() {
      return this.store?.showTutorial || false;
    },
    highScores() {
      return this.store?.highScores || [];
    },
    lastAction() {
      return this.store?.lastAction;
    },
    defeatedByWeapon() {
      return this.store?.defeatedByWeapon || [];
    }
  },

  watch: {
    room: {
      handler() {
        this.draw();
      },
      deep: true
    },
    health() {
      this.draw();
    },
    weapon() {
      this.draw();
    },
    selectedCardIndex() {
      this.draw();
    },
    gameState() {
      this.draw();
    }
  },

  mounted() {
    // Load high scores
    this.store?.loadFromStorage();

    // Set up canvas
    this.$nextTick(() => {
      this.setupCanvas();
      this.draw();
    });

    // Handle resize
    this.resizeObserver = new ResizeObserver(() => {
      this.setupCanvas();
      this.draw();
    });

    if (this.$refs.canvasContainer) {
      this.resizeObserver.observe(this.$refs.canvasContainer);
    }
  },

  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  },

  methods: {
    /**
     * Get icon HTML
     */
    getIcon(name, library = 'lucide', size = 20, className = '') {
      if (window.Helpers?.IconLibrary) {
        return window.Helpers.IconLibrary.getIcon(name, library, size, className);
      }
      return '';
    },

    /**
     * Set up canvas dimensions
     */
    setupCanvas() {
      const canvas = this.$refs.gameCanvas;
      const container = this.$refs.canvasContainer;

      if (!canvas || !container) return;

      // Get container size
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set display size
      this.canvasWidth = Math.min(rect.width - 20, 900);
      this.canvasHeight = Math.min(rect.height - 20, 700);

      // Set canvas size with DPR
      canvas.width = this.canvasWidth * dpr;
      canvas.height = this.canvasHeight * dpr;
      canvas.style.width = this.canvasWidth + 'px';
      canvas.style.height = this.canvasHeight + 'px';

      // Scale context for DPR
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      // Adjust card size based on canvas width
      if (this.canvasWidth < 500) {
        this.cardWidth = 60;
        this.cardHeight = 90;
        this.cardGap = 10;
      } else if (this.canvasWidth < 700) {
        this.cardWidth = 70;
        this.cardHeight = 105;
        this.cardGap = 15;
      } else {
        this.cardWidth = 80;
        this.cardHeight = 120;
        this.cardGap = 20;
      }
    },

    /**
     * Main draw function
     */
    draw() {
      const canvas = this.$refs.gameCanvas;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');

      // Clear canvas
      ctx.fillStyle = this.colors.background;
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

      // Draw based on game state
      if (this.gameState === 'idle') {
        this.drawStartScreen(ctx);
      } else if (this.isPlaying) {
        this.drawGameScreen(ctx);
      } else if (this.isGameOver) {
        this.drawGameOverScreen(ctx);
      }
    },

    /**
     * Draw the start screen
     */
    drawStartScreen(ctx) {
      // Title
      ctx.fillStyle = this.colors.gold;
      ctx.font = 'bold 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCOUNDREL', this.canvasWidth / 2, 100);

      // Subtitle
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Georgia, serif';
      ctx.fillText('A Dungeon Crawler Card Game', this.canvasWidth / 2, 140);

      // Instructions
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#cccccc';
      const instructions = [
        'Navigate the dungeon using a deck of cards.',
        '♠ ♣ Monsters - Fight them (take damage equal to their value)',
        '♦ Weapons - Equip to reduce monster damage',
        '♥ Potions - Restore health (first one per room only)',
        '',
        'Play 3 of 4 cards each room. Survive to win!'
      ];

      instructions.forEach((line, i) => {
        ctx.fillText(line, this.canvasWidth / 2, 200 + i * 28);
      });

      // Draw decorative cards
      this.drawCardBack(ctx, this.canvasWidth / 2 - 100, 380);
      this.drawCardBack(ctx, this.canvasWidth / 2, 380);
      this.drawCardBack(ctx, this.canvasWidth / 2 + 100, 380);
    },

    /**
     * Draw the main game screen
     */
    drawGameScreen(ctx) {
      // Draw stats bar at top
      this.drawStatsBar(ctx);

      // Draw equipped weapon area
      this.drawWeaponArea(ctx);

      // Draw room cards
      this.drawRoom(ctx);

      // Draw deck
      this.drawDeck(ctx);

      // Draw action feedback
      if (this.lastAction) {
        this.drawActionFeedback(ctx);
      }
    },

    /**
     * Draw the stats bar
     */
    drawStatsBar(ctx) {
      const barY = 20;
      const barHeight = 40;

      // Health bar background
      ctx.fillStyle = this.colors.healthBarBg;
      ctx.beginPath();
      ctx.roundRect(20, barY, 200, barHeight, 8);
      ctx.fill();

      // Health bar fill
      const healthPercent = this.health / this.maxHealth;
      ctx.fillStyle = healthPercent > 0.3 ? this.colors.healthBar : this.colors.damageFlash;
      ctx.beginPath();
      ctx.roundRect(20, barY, 200 * healthPercent, barHeight, 8);
      ctx.fill();

      // Health text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`♥ ${this.health}/${this.maxHealth}`, 30, barY + 27);

      // Room counter
      ctx.textAlign = 'center';
      ctx.fillText(`Room ${this.roomsCleared + 1}`, this.canvasWidth / 2, barY + 27);

      // Cards remaining
      ctx.textAlign = 'right';
      ctx.fillText(`Dungeon: ${this.remainingCards} cards`, this.canvasWidth - 20, barY + 27);

      // Cards to play indicator
      ctx.font = '14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(`Play ${this.cardsRemainingThisRoom} more card${this.cardsRemainingThisRoom !== 1 ? 's' : ''}`, this.canvasWidth / 2, barY + 55);
    },

    /**
     * Draw the weapon area
     */
    drawWeaponArea(ctx) {
      const areaX = 20;
      const areaY = 100;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(areaX, areaY, this.cardWidth + 40, this.cardHeight + 60, 8);
      ctx.fill();

      ctx.fillStyle = '#aaaaaa';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Weapon', areaX + (this.cardWidth + 40) / 2, areaY + 15);

      if (this.weapon) {
        this.drawCard(ctx, this.weapon, areaX + 20, areaY + 25, false, false);

        // Show durability
        if (this.weaponDurability !== null) {
          ctx.fillStyle = '#ffcc00';
          ctx.font = '11px Arial, sans-serif';
          ctx.fillText(`Can attack < ${this.weaponDurability}`, areaX + (this.cardWidth + 40) / 2, areaY + this.cardHeight + 45);
        } else {
          ctx.fillStyle = '#88ff88';
          ctx.font = '11px Arial, sans-serif';
          ctx.fillText('Fresh (any target)', areaX + (this.cardWidth + 40) / 2, areaY + this.cardHeight + 45);
        }
      } else {
        // Empty weapon slot
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(areaX + 20, areaY + 25, this.cardWidth, this.cardHeight, 8);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('None', areaX + 20 + this.cardWidth / 2, areaY + 25 + this.cardHeight / 2);
      }
    },

    /**
     * Draw the room cards
     */
    drawRoom(ctx) {
      const totalWidth = this.room.length * this.cardWidth + (this.room.length - 1) * this.cardGap;
      const startX = (this.canvasWidth - totalWidth) / 2;
      const cardY = this.canvasHeight / 2 - this.cardHeight / 2;

      // Store card positions for click detection
      this.cardPositions = [];

      this.room.forEach((card, index) => {
        const x = startX + index * (this.cardWidth + this.cardGap);
        const isSelected = this.selectedCardIndex === index;
        const isHovered = this.hoverCardIndex === index;

        this.cardPositions.push({ x, y: cardY, card, index });

        // Draw card (lifted if selected)
        const offsetY = isSelected ? -20 : (isHovered ? -10 : 0);
        this.drawCard(ctx, card, x, cardY + offsetY, isSelected, isHovered);

        // Draw selection indicator
        if (isSelected) {
          ctx.strokeStyle = this.colors.gold;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(x - 4, cardY + offsetY - 4, this.cardWidth + 8, this.cardHeight + 8, 12);
          ctx.stroke();
        }
      });
    },

    /**
     * Draw a single card
     */
    drawCard(ctx, card, x, y, isSelected = false, isHovered = false) {
      // Card shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, this.cardWidth, this.cardHeight, 8);
      ctx.fill();

      // Card background
      ctx.fillStyle = this.colors.cardFront;
      ctx.beginPath();
      ctx.roundRect(x, y, this.cardWidth, this.cardHeight, 8);
      ctx.fill();

      // Card border
      ctx.strokeStyle = isSelected ? this.colors.gold : '#cccccc';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Determine card color and symbol
      const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
      ctx.fillStyle = isRed ? this.colors.hearts : this.colors.spades;

      // Suit symbol
      const suitSymbol = this.getSuitSymbol(card.suit);

      // Top left corner
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(card.display, x + 6, y + 20);
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText(suitSymbol, x + 6, y + 36);

      // Center symbol (large)
      ctx.font = '36px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(suitSymbol, x + this.cardWidth / 2, y + this.cardHeight / 2 + 10);

      // Bottom right corner (upside down)
      ctx.save();
      ctx.translate(x + this.cardWidth - 6, y + this.cardHeight - 8);
      ctx.rotate(Math.PI);
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(card.display, 0, 12);
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText(suitSymbol, 0, 28);
      ctx.restore();

      // Card type indicator
      ctx.font = '10px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#666666';
      const typeLabel = card.type.charAt(0).toUpperCase() + card.type.slice(1);
      ctx.fillText(typeLabel, x + this.cardWidth / 2, y + this.cardHeight - 8);
    },

    /**
     * Draw a card back
     */
    drawCardBack(ctx, x, y) {
      // Card shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, this.cardWidth, this.cardHeight, 8);
      ctx.fill();

      // Card back
      ctx.fillStyle = this.colors.cardBack;
      ctx.beginPath();
      ctx.roundRect(x, y, this.cardWidth, this.cardHeight, 8);
      ctx.fill();

      // Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 20 + i * 15);
        ctx.lineTo(x + this.cardWidth - 10, y + 20 + i * 15);
        ctx.stroke();
      }

      // Border
      ctx.strokeStyle = '#2d5a87';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, this.cardWidth, this.cardHeight, 8);
      ctx.stroke();
    },

    /**
     * Draw the deck pile
     */
    drawDeck(ctx) {
      const deckX = this.canvasWidth - this.cardWidth - 40;
      const deckY = 100;

      // Draw stacked cards
      const stackCount = Math.min(5, Math.ceil(this.remainingCards / 8));
      for (let i = 0; i < stackCount; i++) {
        this.drawCardBack(ctx, deckX - i * 2, deckY - i * 2);
      }

      // Card count
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.remainingCards}`, deckX + this.cardWidth / 2, deckY + this.cardHeight + 20);
    },

    /**
     * Draw action feedback
     */
    drawActionFeedback(ctx) {
      const action = this.lastAction;
      if (!action) return;

      const feedbackY = this.canvasHeight - 80;

      ctx.font = '16px Arial, sans-serif';
      ctx.textAlign = 'center';

      if (action.type === 'fight') {
        if (action.weaponUsed) {
          ctx.fillStyle = '#88ff88';
          ctx.fillText(`Attacked ${action.monster.display} with weapon! Took ${action.damage} damage.`, this.canvasWidth / 2, feedbackY);
        } else {
          ctx.fillStyle = '#ff8888';
          ctx.fillText(`Fought ${action.monster.display} bare-handed! Took ${action.damage} damage.`, this.canvasWidth / 2, feedbackY);
        }
      } else if (action.type === 'equip') {
        ctx.fillStyle = '#88ccff';
        ctx.fillText(`Equipped ${action.weapon.display}♦ weapon!`, this.canvasWidth / 2, feedbackY);
      } else if (action.type === 'potion') {
        if (action.wasted) {
          ctx.fillStyle = '#ffcc88';
          ctx.fillText(`Potion wasted! (Only first potion per room heals)`, this.canvasWidth / 2, feedbackY);
        } else {
          ctx.fillStyle = '#88ff88';
          ctx.fillText(`Healed ${action.healed} health!`, this.canvasWidth / 2, feedbackY);
        }
      } else if (action.type === 'skip') {
        ctx.fillStyle = '#cccccc';
        ctx.fillText('Room skipped! Cards returned to dungeon.', this.canvasWidth / 2, feedbackY);
      }
    },

    /**
     * Draw game over screen
     */
    drawGameOverScreen(ctx) {
      // Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

      // Result
      ctx.textAlign = 'center';
      if (this.gameState === 'won') {
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 48px Georgia, serif';
        ctx.fillText('VICTORY!', this.canvasWidth / 2, 150);

        ctx.fillStyle = '#88ff88';
        ctx.font = '24px Georgia, serif';
        ctx.fillText('You conquered the dungeon!', this.canvasWidth / 2, 200);
      } else {
        ctx.fillStyle = this.colors.damageFlash;
        ctx.font = 'bold 48px Georgia, serif';
        ctx.fillText('DEFEATED', this.canvasWidth / 2, 150);

        ctx.fillStyle = '#ff8888';
        ctx.font = '24px Georgia, serif';
        ctx.fillText('The dungeon claims another soul...', this.canvasWidth / 2, 200);
      }

      // Stats
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px Arial, sans-serif';
      ctx.fillText(`Score: ${this.score}`, this.canvasWidth / 2, 280);
      ctx.fillText(`Rooms Cleared: ${this.roomsCleared}`, this.canvasWidth / 2, 310);
      ctx.fillText(`Monsters Defeated: ${this.store?.monstersDefeated || 0}`, this.canvasWidth / 2, 340);
      ctx.fillText(`Health Remaining: ${this.health}`, this.canvasWidth / 2, 370);
    },

    /**
     * Get suit symbol
     */
    getSuitSymbol(suit) {
      const symbols = {
        hearts: '♥',
        diamonds: '♦',
        spades: '♠',
        clubs: '♣'
      };
      return symbols[suit] || '?';
    },

    /**
     * Handle canvas click
     */
    handleCanvasClick(event) {
      if (!this.isPlaying) return;

      const canvas = this.$refs.gameCanvas;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if clicked on a room card
      if (this.cardPositions) {
        for (const pos of this.cardPositions) {
          if (x >= pos.x && x <= pos.x + this.cardWidth &&
              y >= pos.y - 20 && y <= pos.y + this.cardHeight) {
            this.store?.selectCard(pos.index);
            return;
          }
        }
      }

      // Clicked elsewhere - deselect
      if (this.selectedCardIndex !== null) {
        this.store?.selectCard(this.selectedCardIndex);
      }
    },

    /**
     * Handle canvas mouse move for hover effects
     */
    handleCanvasMouseMove(event) {
      if (!this.isPlaying) return;

      const canvas = this.$refs.gameCanvas;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      let newHover = null;

      if (this.cardPositions) {
        for (const pos of this.cardPositions) {
          if (x >= pos.x && x <= pos.x + this.cardWidth &&
              y >= pos.y - 20 && y <= pos.y + this.cardHeight) {
            newHover = pos.index;
            break;
          }
        }
      }

      if (newHover !== this.hoverCardIndex) {
        this.hoverCardIndex = newHover;
        this.draw();
      }
    },

    /**
     * Handle canvas mouse leave
     */
    handleCanvasMouseLeave() {
      if (this.hoverCardIndex !== null) {
        this.hoverCardIndex = null;
        this.draw();
      }
    },

    /**
     * Play the selected card
     */
    playSelectedCard(useWeapon = false) {
      if (this.selectedCardIndex === null) return;
      this.store?.playCard(this.selectedCardIndex, { useWeapon });
    },

    /**
     * Check if weapon can be used on selected card
     */
    canUseWeaponOnSelected() {
      if (this.selectedCardIndex === null || !this.weapon) return false;
      const card = this.room[this.selectedCardIndex];
      if (!card || card.type !== 'monster') return false;
      return this.store?.canAttackWithWeapon(card.value);
    },

    /**
     * Get selected card
     */
    getSelectedCard() {
      if (this.selectedCardIndex === null) return null;
      return this.room[this.selectedCardIndex];
    },

    /**
     * Calculate damage preview
     */
    getDamagePreview(useWeapon) {
      const card = this.getSelectedCard();
      if (!card || card.type !== 'monster') return 0;
      return this.store?.calculateDamage(card, useWeapon) || 0;
    },

    /**
     * Start new game
     */
    startGame() {
      this.store?.startGame();
    },

    /**
     * Skip current room
     */
    skipRoom() {
      this.store?.skipRoom();
    },

    /**
     * Toggle tutorial
     */
    toggleTutorial() {
      this.store?.toggleTutorial();
    }
  },

  template: `
    <div class="scoundrel-panel">
      <div class="scoundrel-header">
        <h2 class="scoundrel-title">
          <span v-html="getIcon('swords', 'lucide', 24, 'text-primary-custom')"></span>
          Scoundrel
        </h2>
        <button
          @click="toggleTutorial"
          class="btn-secondary scoundrel-help-btn"
          title="How to play"
        >
          <span v-html="getIcon('helpCircle', 'lucide', 20, '')"></span>
        </button>
      </div>

      <!-- Tutorial Modal -->
      <div v-if="showTutorial" class="scoundrel-tutorial-overlay" @click.self="toggleTutorial">
        <div class="scoundrel-tutorial">
          <div class="scoundrel-tutorial-header">
            <h3>How to Play Scoundrel</h3>
            <button @click="toggleTutorial" class="btn-icon">
              <span v-html="getIcon('x', 'lucide', 20, '')"></span>
            </button>
          </div>
          <div class="scoundrel-tutorial-content">
            <h4>Goal</h4>
            <p>Survive the dungeon by playing through all the cards!</p>

            <h4>Card Types</h4>
            <ul>
              <li><strong>♠ ♣ Monsters (Spades &amp; Clubs)</strong> - Fight them! They deal damage equal to their value.</li>
              <li><strong>♦ Weapons (Diamonds)</strong> - Equip to reduce monster damage. Weapon damage is subtracted from monster damage.</li>
              <li><strong>♥ Potions (Hearts)</strong> - Restore health equal to the card value. Only the first potion per room works!</li>
            </ul>

            <h4>Gameplay</h4>
            <ul>
              <li>Each room has 4 cards. You must play exactly 3 of them.</li>
              <li>The remaining card stays for the next room.</li>
              <li>You can skip a room (once, not twice in a row) to reshuffle those cards into the deck.</li>
              <li>Weapons can only attack monsters weaker than the last monster they defeated.</li>
            </ul>

            <h4>Tips</h4>
            <ul>
              <li>Save your weapon for big monsters!</li>
              <li>Use potions strategically - only one works per room.</li>
              <li>Sometimes it's better to take a small hit than waste a good weapon.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Game Canvas -->
      <div ref="canvasContainer" class="scoundrel-canvas-container">
        <canvas
          ref="gameCanvas"
          @click="handleCanvasClick"
          @mousemove="handleCanvasMouseMove"
          @mouseleave="handleCanvasMouseLeave"
          class="scoundrel-canvas"
        ></canvas>
      </div>

      <!-- Control Buttons -->
      <div class="scoundrel-controls">
        <!-- Start/Restart Button -->
        <button
          v-if="!isPlaying"
          @click="startGame"
          class="btn-primary scoundrel-start-btn"
        >
          <span v-html="getIcon('play', 'lucide', 20, '')"></span>
          {{ isGameOver ? 'Play Again' : 'Start Game' }}
        </button>

        <!-- In-game controls -->
        <template v-if="isPlaying">
          <!-- Selected card actions -->
          <div v-if="getSelectedCard()" class="scoundrel-action-buttons">
            <template v-if="getSelectedCard().type === 'monster'">
              <button
                @click="playSelectedCard(false)"
                class="btn-danger"
              >
                <span v-html="getIcon('swords', 'lucide', 18, '')"></span>
                Fight ({{ getDamagePreview(false) }} dmg)
              </button>
              <button
                v-if="canUseWeaponOnSelected()"
                @click="playSelectedCard(true)"
                class="btn-primary"
              >
                <span v-html="getIcon('shield', 'lucide', 18, '')"></span>
                Use Weapon ({{ getDamagePreview(true) }} dmg)
              </button>
            </template>
            <template v-else-if="getSelectedCard().type === 'weapon'">
              <button @click="playSelectedCard()" class="btn-primary">
                <span v-html="getIcon('swords', 'lucide', 18, '')"></span>
                Equip Weapon
              </button>
            </template>
            <template v-else-if="getSelectedCard().type === 'potion'">
              <button @click="playSelectedCard()" class="btn-success">
                <span v-html="getIcon('heart', 'lucide', 18, '')"></span>
                Drink Potion
              </button>
            </template>
          </div>

          <!-- Skip room button -->
          <button
            v-if="canSkip"
            @click="skipRoom"
            class="btn-secondary scoundrel-skip-btn"
          >
            <span v-html="getIcon('skipForward', 'lucide', 18, '')"></span>
            Skip Room
          </button>

          <p v-if="!getSelectedCard()" class="scoundrel-hint">
            Click a card to select it
          </p>
        </template>
      </div>

      <!-- High Scores -->
      <div v-if="highScores.length > 0 && !isPlaying" class="scoundrel-high-scores">
        <h4>High Scores</h4>
        <ol>
          <li v-for="(score, index) in highScores.slice(0, 5)" :key="index">
            {{ score.score }} pts
            <span :class="score.won ? 'text-success' : 'text-danger'">
              {{ score.won ? '(Won!)' : '(Defeated)' }}
            </span>
            - {{ score.roomsCleared }} rooms
          </li>
        </ol>
      </div>
    </div>
  `
});

// Register component globally
if (typeof window !== 'undefined') {
  window.ScoundrelGamePanel = ScoundrelGamePanel;
}
