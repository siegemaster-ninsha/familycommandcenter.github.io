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
