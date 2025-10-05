# Shoelace Chore Page - Modular Components

This folder contains the modular Vue 3 components extracted from the original monolithic `shoelace-chore-page.js` file.

## Components

### 1. QuicklistSection (`QuicklistSection.js`)
Handles the quicklist functionality including:
- Quicklist chore display and management
- Selection mode for bulk operations
- Add/remove quicklist items
- Loading and error states

### 2. UnassignedChoresSection (`UnassignedChoresSection.js`)
Manages unassigned chores:
- Display of available unassigned chores
- Chore selection and assignment
- Add new chore functionality
- Delete chores

### 3. FamilyMembersSection (`FamilyMembersSection.js`)
Handles family members and assigned chores:
- Family member display with electronics status
- Assigned chores for each member
- Chore completion functionality
- Assignment interactions

### 4. EarningsSummarySection (`EarningsSummarySection.js`)
Displays earnings summary:
- Earnings cards for each family member
- Completed chores count
- Spending modal integration

## Usage

The components are designed to work together in the main `ShoelaceChorePage` component:

```javascript
import {
  QuicklistSectionComponent,
  UnassignedChoresSectionComponent,
  FamilyMembersSectionComponent,
  EarningsSummarySectionComponent
} from './shoelace-chore-page/index.js';

const ShoelaceChorePage = Vue.defineComponent({
  components: {
    'quicklist-section': QuicklistSectionComponent,
    'unassigned-chores-section': UnassignedChoresSectionComponent,
    'family-members-section': FamilyMembersSectionComponent,
    'earnings-summary-section': EarningsSummarySectionComponent
  },
  template: `
    <div>
      <quicklist-section />
      <unassigned-chores-section />
      <family-members-section />
      <earnings-summary-section />
    </div>
  `
});
```

## Architecture Benefits

1. **Separation of Concerns**: Each component handles a specific responsibility
2. **Reusability**: Components can be used independently or in other contexts
3. **Maintainability**: Easier to modify and test individual features
4. **Performance**: Better tree-shaking and code splitting potential
5. **Developer Experience**: Cleaner, more organized codebase

## Component Communication

Components communicate through:
- **Inject/Provide**: Shared state and utilities
- **Event Emission**: Parent-child communication for actions
- **Parent Methods**: Direct method calls for complex operations

Each component receives necessary dependencies through Vue's inject system and communicates back to the parent for state changes and API calls.
