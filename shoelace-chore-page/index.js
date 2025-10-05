// Shoelace Chore Page Components - Modular Vue 3 Components
// Export all components for easy importing

export { default as QuicklistSectionComponent } from './QuicklistSection.js';
export { default as UnassignedChoresSectionComponent } from './UnassignedChoresSection.js';
export { default as FamilyMembersSectionComponent } from './FamilyMembersSection.js';
export { default as EarningsSummarySectionComponent } from './EarningsSummarySection.js';

// Also provide window exports for manual registration (existing pattern)
export * from './QuicklistSection.js';
export * from './UnassignedChoresSection.js';
export * from './FamilyMembersSection.js';
export * from './EarningsSummarySection.js';
