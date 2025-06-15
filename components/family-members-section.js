// Family Members Section Component  
const FamilyMembersSection = Vue.defineComponent({
  template: `
    <div class="mb-6">
      <div class="flex items-center justify-between px-4 pb-3 pt-5">
        <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em]">Family Members</h2>
        <button
          @click="showAddPersonModal = true"
          class="flex items-center gap-2 bg-[#607afb] hover:bg-[#4f68d8] text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
          </svg>
          Add Person
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Dynamic Person Sections -->
        <div 
          v-for="person in people"
          :key="person.id"
          :class="getDropZoneClasses(person.name)"
          @drop="handleDrop($event, person.name)"
          @dragover.prevent
          @dragenter.prevent
          @click="assignSelectedChore(person.name)"
          :data-person="person.name"
        >
          <div class="flex items-center justify-between px-4 pb-3 pt-5">
            <h3 class="text-[#0d0f1c] text-[20px] font-bold leading-tight tracking-[-0.015em]">{{ person.name }}</h3>
            <div class="flex items-center gap-2">
              <div class="text-xs px-2 py-1 rounded-full" 
                   :class="person.electronicsStatus.status === 'allowed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ person.electronicsStatus.message }}
              </div>
              <button
                @click.stop="deletePerson(person)"
                class="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                :title="'Remove ' + person.name"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="min-h-[100px] px-4 pb-4">
            <div 
              v-for="chore in choresByPerson[person.name]" 
              :key="chore.id"
              :class="getChoreClasses(chore)"
              draggable="true"
              @dragstart="handleDragStart($event, chore)"
              @click.stop="selectChore(chore, $event)"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex items-center justify-center rounded-lg bg-white shrink-0 size-10"
                  :class="getCategoryStyle(chore.category).icon"
                  v-html="getCategoryIcon(chore.category)"
                >
                </div>
                <div class="flex flex-col justify-center">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="text-[#0d0f1c] text-sm font-medium leading-normal line-clamp-1">{{ chore.name }}</p>
                    <span class="text-xs px-2 py-1 rounded-full" :class="getCategoryStyle(chore.category).badge">
                      {{ getCategoryLabel(chore.category) }}
                    </span>
                  </div>
                  <p v-if="chore.amount > 0" class="text-[#47569e] text-xs font-normal leading-normal">\${{ chore.amount.toFixed(2) }}</p>
                </div>
              </div>
              <div class="shrink-0">
                <div class="flex size-6 items-center justify-center">
                  <input
                    type="checkbox"
                    v-model="chore.completed"
                    @change="handleChoreCompletion(chore)"
                    class="h-4 w-4 rounded border-[#ced2e9] border-2 bg-transparent text-[#607afb] checked:bg-[#607afb] checked:border-[#607afb] checked:bg-[image:--checkbox-tick-svg] focus:ring-0 focus:ring-offset-0 focus:border-[#ced2e9] focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            <!-- Drop zone indicator -->
            <div v-if="choresByPerson[person.name].length === 0" class="text-center text-[#47569e] py-8 border-2 border-dashed border-[#ced2e9] rounded-lg bg-[#f8f9fc]">
              <p class="text-sm">Drag chores here to assign to {{ person.name }}</p>
              <p v-if="selectedChore" class="text-xs mt-1 text-blue-600">Or click here to assign selected chore</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Earnings Section -->
      <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Earnings</h2>
      <div class="p-4">
        <div 
          v-for="person in people" 
          :key="person.id"
          class="flex justify-between gap-x-6 py-2"
        >
          <p class="text-[#47569e] text-sm font-normal leading-normal">{{ person.name }}</p>
          <p class="text-[#0d0f1c] text-sm font-normal leading-normal text-right">\${{ person.earnings.toFixed(2) }}</p>
        </div>
      </div>
    </div>
  `,
  inject: ['people', 'choresByPerson', 'selectedChore', 'showAddPersonModal'],
  methods: {
    getDropZoneClasses(person) {
      const baseClasses = "bg-white rounded-lg shadow-sm border transition-all duration-200";
      const highlightClasses = this.$parent.selectedChore ? "ring-2 ring-green-400 ring-opacity-50 bg-green-50" : "";
      
      return `${baseClasses} ${highlightClasses}`;
    },

    getChoreClasses(chore) {
      const baseClasses = "flex items-center gap-4 px-4 min-h-[72px] py-2 justify-between mb-2 rounded-lg shadow-sm cursor-pointer border-l-4 transition-all duration-200";
      const categoryClasses = this.getCategoryStyle(chore.category).background;
      const selectedClasses = this.isChoreSelected(chore) ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-102";
      
      return `${baseClasses} ${categoryClasses} ${selectedClasses}`;
    },

    isChoreSelected(chore) {
      return this.$parent.selectedChoreId && chore.id === this.$parent.selectedChoreId;
    },

    getCategoryStyle(category) {
      switch(category) {
        case 'school':
          return {
            background: 'bg-blue-50 border-l-blue-500',
            icon: 'text-blue-600',
            badge: 'bg-blue-100 text-blue-800'
          };
        case 'game':
          return {
            background: 'bg-green-50 border-l-green-500',
            icon: 'text-green-600',
            badge: 'bg-green-100 text-green-800'
          };
        default:
          return {
            background: 'bg-[#f8f9fc] border-l-gray-300',
            icon: 'text-[#0d0f1c]',
            badge: 'bg-gray-100 text-gray-800'
          };
      }
    },

    getCategoryIcon(category) {
      switch(category) {
        case 'school':
          return `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M208,24H72A32,32,0,0,0,40,56V224a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16H56a16,16,0,0,1,16-16H208a8,8,0,0,0,8-8V32A8,8,0,0,0,208,24ZM72,40H200V184H72a31.82,31.82,0,0,0-16,4.29V56A16,16,0,0,1,72,40Z"></path>
          </svg>`;
        case 'game':
          return `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M192,88h16a8,8,0,0,1,0,16H192a8,8,0,0,1,0-16ZM48,104H64a8,8,0,0,0,0-16H48a8,8,0,0,0,0,16ZM208,40H48A24,24,0,0,0,24,64V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V64A24,24,0,0,0,208,40ZM216,192a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8V192Z"></path>
          </svg>`;
        default:
          return `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11a16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A8,8,0,0,0,32,110.62V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V110.62A8,8,0,0,0,218.83,103.77ZM208,208H48V115.54L128,44.77,208,115.54V208ZM112,176V136a8,8,0,0,1,8-8h16a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V144H120v32a8,8,0,0,1-16,0Z"></path>
          </svg>`;
      }
    },

    getCategoryLabel(category) {
      switch(category) {
        case 'school': return '📚 School';
        case 'game': return '⚡ Electronics';
        default: return '🏠 Regular';
      }
    },

    handleDragStart(event, chore) {
      this.$parent.draggedChore = chore;
      event.dataTransfer.effectAllowed = 'move';
    },

    selectChore(chore, event) {
      console.log('selectChore called for:', chore.name, 'Current selectedChoreId:', this.$parent.selectedChoreId);
      
      // Special case: If we have a different chore selected and we click on a chore that's assigned to someone,
      // assign the selected chore to that person
      if (this.$parent.selectedChore && 
          this.$parent.selectedChoreId !== chore.id && 
          chore.assignedTo && 
          chore.assignedTo !== 'unassigned') {
        console.log('Assigning selected chore to:', chore.assignedTo);
        this.$parent.assignSelectedChore(chore.assignedTo);
        return;
      }
      
      if (this.$parent.selectedChoreId === chore.id) {
        // Clicking the same chore deselects it
        console.log('Deselecting chore:', chore.name);
        this.$parent.selectedChoreId = null;
        this.$parent.selectedQuicklistChore = null;
      } else {
        // Select the chore
        console.log('Selecting chore:', chore.name, 'ID:', chore.id);
        this.$parent.selectedChoreId = chore.id;
        this.$parent.selectedQuicklistChore = null;
      }
    },

    async assignSelectedChore(assignTo) {
      if (!this.$parent.selectedChore) return;
      
      try {
        if (this.$parent.selectedChore.isNewFromQuicklist) {
          // This is a new chore from quicklist
          const choreData = {
            name: this.$parent.selectedChore.name,
            amount: this.$parent.selectedChore.amount,
            category: this.$parent.selectedChore.category,
            assignedTo: assignTo
          };
          await this.$parent.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
            method: 'POST',
            body: JSON.stringify(choreData)
          });
        } else {
          // This is an existing chore being moved
          await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${this.$parent.selectedChore.id}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ assignedTo: assignTo })
          });
        }
        
        // Reload data to get updated state
        await this.$parent.loadChores();
        await this.$parent.loadEarnings();
        await this.$parent.loadElectronicsStatus();
        
        // Clear selection
        this.$parent.selectedChoreId = null;
        this.$parent.selectedQuicklistChore = null;
      } catch (error) {
        console.error('Failed to assign chore:', error);
      }
    },

    async handleDrop(event, assignTo) {
      event.preventDefault();
      if (this.$parent.draggedChore) {
        try {
          if (this.$parent.draggedChore.isNewFromQuicklist) {
            // This is a new chore from quicklist
            const choreData = {
              name: this.$parent.draggedChore.name,
              amount: this.$parent.draggedChore.amount,
              category: this.$parent.draggedChore.category,
              assignedTo: assignTo
            };
            await this.$parent.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
              method: 'POST',
              body: JSON.stringify(choreData)
            });
          } else {
            // This is an existing chore being moved
            await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${this.$parent.draggedChore.id}/assign`, {
              method: 'PUT',
              body: JSON.stringify({ assignedTo: assignTo })
            });
          }
          
          // Reload data to get updated state
          await this.$parent.loadChores();
          await this.$parent.loadEarnings();
          await this.$parent.loadElectronicsStatus();
        } catch (error) {
          console.error('Failed to assign chore:', error);
        }
        
        this.$parent.draggedChore = null;
      }
    },

    async handleChoreCompletion(chore) {
      try {
        await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/complete`, {
          method: 'PUT',
          body: JSON.stringify({ completed: chore.completed })
        });
        
        if (chore.completed) {
          this.$parent.triggerConfetti();
          this.$parent.showSuccessMessage = true;
          this.$parent.completedChoreMessage = `${chore.name} completed!`;
          
          setTimeout(() => {
            this.$parent.showSuccessMessage = false;
          }, 3000);
        }
        
        await this.$parent.loadEarnings();
        await this.$parent.loadElectronicsStatus();
      } catch (error) {
        console.error('Failed to update chore completion:', error);
        // Revert the checkbox if API call failed
        chore.completed = !chore.completed;
      }
    },

    deletePerson(person) {
      this.$parent.personToDelete = person;
      this.$parent.showDeletePersonModal = true;
    }
  }
});

// Export component for manual registration
window.FamilyMembersSectionComponent = FamilyMembersSection; 