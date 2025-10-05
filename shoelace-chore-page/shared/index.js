// Shared UI Components for Shoelace Chore Page
// Export all reusable components

export { default as SectionHeaderComponent } from './SectionHeader.js';
export { default as LoadingSpinnerComponent } from './LoadingSpinner.js';
export { default as ErrorStateComponent } from './ErrorState.js';
export { default as EmptyStateComponent } from './EmptyState.js';
export { default as IconContainerComponent } from './IconContainer.js';

// Also provide window exports for manual registration (existing pattern)
export * from './SectionHeader.js';
export * from './LoadingSpinner.js';
export * from './ErrorState.js';
export * from './EmptyState.js';
export * from './IconContainer.js';

// Export section components
export { default as QuicklistSectionComponent } from '../QuicklistSection.js';
export { default as UnassignedChoresSectionComponent } from '../UnassignedChoresSection.js';
export { default as ShoelaceFamilyMembersSectionComponent } from '../ShoelaceFamilyMembersSection.js';
export { default as EarningsSummarySectionComponent } from '../EarningsSummarySection.js';

export * from '../QuicklistSection.js';
export * from '../UnassignedChoresSection.js';
export * from '../ShoelaceFamilyMembersSection.js';
export * from '../EarningsSummarySection.js';
