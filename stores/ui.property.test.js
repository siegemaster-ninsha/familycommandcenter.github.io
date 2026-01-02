/**
 * Property-Based Tests for UI Store - Modal Registry
 * 
 * **Feature: app-js-refactoring, Property 4: Modal Registry Pattern**
 * **Validates: Requirements 4.1**
 * 
 * Property: For any modal name string, calling openModal(name, data) followed by
 * closeModal(name) SHALL result in isModalOpen(name) returning false and
 * getModalData(name) returning null.
 * 
 * **Feature: app-js-refactoring, Property 5: Modal Open Detection**
 * **Validates: Requirements 4.4**
 * 
 * Property: For any set of modal states, hasAnyModalOpen SHALL return true if and
 * only if at least one modal has isOpen === true.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';

describe('UI Store Modal Registry Property Tests', () => {
  let createStore;

  beforeEach(() => {
    // Create a fresh store instance for each test
    createStore = () => {
      const state = {
        modals: {}
      };

      return {
        modals: state.modals,
        
        // Getters
        isModalOpen(modalName) {
          return this.modals[modalName]?.isOpen || false;
        },
        
        getModalData(modalName) {
          return this.modals[modalName]?.data || null;
        },
        
        get hasAnyModalOpen() {
          return Object.values(this.modals).some(modal => modal?.isOpen === true);
        },
        
        // Actions
        openModal(modalName, data = null) {
          if (!this.modals[modalName]) {
            this.modals[modalName] = { isOpen: false, data: null };
          }
          this.modals[modalName].isOpen = true;
          this.modals[modalName].data = data;
        },
        
        closeModal(modalName) {
          if (this.modals[modalName]) {
            this.modals[modalName].isOpen = false;
            this.modals[modalName].data = null;
          }
        },
        
        closeAllModals() {
          Object.keys(this.modals).forEach(name => {
            this.modals[name].isOpen = false;
            this.modals[name].data = null;
          });
        }
      };
    };
  });

  /**
   * Reserved JavaScript property names that should not be used as modal names
   */
  const reservedPropertyNames = new Set([
    'constructor', 'prototype', '__proto__', 'hasOwnProperty',
    'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString',
    'toString', 'valueOf'
  ]);

  /**
   * Arbitrary for generating valid modal names (non-empty strings, excluding reserved names)
   */
  const modalNameArbitrary = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0 && !reservedPropertyNames.has(s));

  /**
   * Arbitrary for generating modal data (any JSON-serializable value)
   */
  const modalDataArbitrary = fc.oneof(
    fc.constant(null),
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 0, maxLength: 100 })
    }),
    fc.record({
      userId: fc.integer({ min: 1, max: 10000 }),
      action: fc.constantFrom('view', 'edit', 'delete')
    }),
    fc.array(fc.integer(), { minLength: 0, maxLength: 10 })
  );

  /**
   * Arbitrary for generating a set of modal names with their open states
   */
  const modalStatesArbitrary = fc.array(
    fc.record({
      name: modalNameArbitrary,
      isOpen: fc.boolean()
    }),
    { minLength: 0, maxLength: 20 }
  ).map(modals => {
    // Deduplicate by name, keeping last occurrence
    const seen = new Map();
    modals.forEach(m => seen.set(m.name, m.isOpen));
    return Array.from(seen.entries()).map(([name, isOpen]) => ({ name, isOpen }));
  });

  /**
   * **Feature: app-js-refactoring, Property 4: Modal Registry Pattern**
   * **Validates: Requirements 4.1**
   * 
   * For any modal name, openModal followed by closeModal results in closed state.
   */
  it('Property 4: openModal then closeModal results in isModalOpen returning false', async () => {
    await fc.assert(
      fc.property(
        modalNameArbitrary,
        modalDataArbitrary,
        (modalName, modalData) => {
          const store = createStore();
          
          // Open the modal with data
          store.openModal(modalName, modalData);
          
          // Verify it's open
          expect(store.isModalOpen(modalName)).toBe(true);
          
          // Close the modal
          store.closeModal(modalName);
          
          // Property: After close, isModalOpen returns false
          expect(store.isModalOpen(modalName)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 4: Modal Registry Pattern**
   * **Validates: Requirements 4.1**
   * 
   * For any modal name, openModal followed by closeModal clears the data.
   */
  it('Property 4: openModal then closeModal results in getModalData returning null', async () => {
    await fc.assert(
      fc.property(
        modalNameArbitrary,
        modalDataArbitrary.filter(d => d !== null), // Use non-null data to verify clearing
        (modalName, modalData) => {
          const store = createStore();
          
          // Open the modal with data
          store.openModal(modalName, modalData);
          
          // Verify data is stored
          expect(store.getModalData(modalName)).toEqual(modalData);
          
          // Close the modal
          store.closeModal(modalName);
          
          // Property: After close, getModalData returns null
          expect(store.getModalData(modalName)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 4: Modal Registry Pattern**
   * **Validates: Requirements 4.1**
   * 
   * For any sequence of open/close operations, the final state is consistent.
   */
  it('Property 4: Multiple open/close cycles maintain consistent state', async () => {
    await fc.assert(
      fc.property(
        modalNameArbitrary,
        fc.array(modalDataArbitrary, { minLength: 1, maxLength: 10 }),
        (modalName, dataSequence) => {
          const store = createStore();
          
          // Perform multiple open/close cycles
          for (const data of dataSequence) {
            store.openModal(modalName, data);
            expect(store.isModalOpen(modalName)).toBe(true);
            expect(store.getModalData(modalName)).toEqual(data);
            
            store.closeModal(modalName);
            expect(store.isModalOpen(modalName)).toBe(false);
            expect(store.getModalData(modalName)).toBeNull();
          }
          
          // Property: Final state is closed with null data
          expect(store.isModalOpen(modalName)).toBe(false);
          expect(store.getModalData(modalName)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 5: Modal Open Detection**
   * **Validates: Requirements 4.4**
   * 
   * hasAnyModalOpen returns true iff at least one modal is open.
   */
  it('Property 5: hasAnyModalOpen returns true iff at least one modal has isOpen === true', async () => {
    await fc.assert(
      fc.property(
        modalStatesArbitrary,
        (modalStates) => {
          const store = createStore();
          
          // Setup modals with specified states
          for (const { name, isOpen } of modalStates) {
            if (isOpen) {
              store.openModal(name);
            } else {
              // Register but keep closed
              store.openModal(name);
              store.closeModal(name);
            }
          }
          
          // Calculate expected result
          const expectedHasAnyOpen = modalStates.some(m => m.isOpen);
          
          // Property: hasAnyModalOpen matches expected
          expect(store.hasAnyModalOpen).toBe(expectedHasAnyOpen);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 5: Modal Open Detection**
   * **Validates: Requirements 4.4**
   * 
   * hasAnyModalOpen is false when no modals exist.
   */
  it('Property 5: hasAnyModalOpen returns false for empty modal registry', () => {
    const store = createStore();
    
    // Property: Empty registry has no open modals
    expect(store.hasAnyModalOpen).toBe(false);
  });

  /**
   * **Feature: app-js-refactoring, Property 5: Modal Open Detection**
   * **Validates: Requirements 4.4**
   * 
   * hasAnyModalOpen updates correctly as modals are opened and closed.
   */
  it('Property 5: hasAnyModalOpen updates correctly during open/close operations', async () => {
    await fc.assert(
      fc.property(
        fc.array(modalNameArbitrary, { minLength: 1, maxLength: 10 }),
        (modalNames) => {
          const store = createStore();
          const uniqueNames = [...new Set(modalNames)];
          
          // Initially no modals open
          expect(store.hasAnyModalOpen).toBe(false);
          
          // Open all modals
          for (const name of uniqueNames) {
            store.openModal(name);
            // Property: After opening any modal, hasAnyModalOpen is true
            expect(store.hasAnyModalOpen).toBe(true);
          }
          
          // Close modals one by one
          for (let i = 0; i < uniqueNames.length; i++) {
            store.closeModal(uniqueNames[i]);
            
            const remainingOpen = uniqueNames.length - i - 1;
            // Property: hasAnyModalOpen reflects remaining open modals
            expect(store.hasAnyModalOpen).toBe(remainingOpen > 0);
          }
          
          // Property: After closing all, hasAnyModalOpen is false
          expect(store.hasAnyModalOpen).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 5: Modal Open Detection**
   * **Validates: Requirements 4.4**
   * 
   * closeAllModals results in hasAnyModalOpen being false.
   */
  it('Property 5: closeAllModals results in hasAnyModalOpen returning false', async () => {
    await fc.assert(
      fc.property(
        fc.array(modalNameArbitrary, { minLength: 1, maxLength: 20 }),
        (modalNames) => {
          const store = createStore();
          const uniqueNames = [...new Set(modalNames)];
          
          // Open all modals
          for (const name of uniqueNames) {
            store.openModal(name);
          }
          
          // Verify at least one is open
          expect(store.hasAnyModalOpen).toBe(true);
          
          // Close all modals
          store.closeAllModals();
          
          // Property: After closeAllModals, hasAnyModalOpen is false
          expect(store.hasAnyModalOpen).toBe(false);
          
          // Verify each modal is closed
          for (const name of uniqueNames) {
            expect(store.isModalOpen(name)).toBe(false);
            expect(store.getModalData(name)).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 4: Modal Registry Pattern**
   * **Validates: Requirements 4.1**
   * 
   * Opening a modal that doesn't exist creates it dynamically.
   */
  it('Property 4: Dynamic modal registration works for any valid modal name', async () => {
    await fc.assert(
      fc.property(
        modalNameArbitrary,
        modalDataArbitrary,
        (modalName, modalData) => {
          const store = createStore();
          
          // Modal doesn't exist yet
          expect(store.modals[modalName]).toBeUndefined();
          expect(store.isModalOpen(modalName)).toBe(false);
          expect(store.getModalData(modalName)).toBeNull();
          
          // Open creates the modal
          store.openModal(modalName, modalData);
          
          // Property: Modal is now registered and open
          expect(store.modals[modalName]).toBeDefined();
          expect(store.isModalOpen(modalName)).toBe(true);
          expect(store.getModalData(modalName)).toEqual(modalData);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 4: Modal Registry Pattern**
   * **Validates: Requirements 4.1**
   * 
   * Closing one modal doesn't affect other modals.
   */
  it('Property 4: Closing one modal does not affect other modals', async () => {
    await fc.assert(
      fc.property(
        fc.array(modalNameArbitrary, { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0 }),
        (modalNames, closeIndex) => {
          const store = createStore();
          const uniqueNames = [...new Set(modalNames)];
          
          if (uniqueNames.length < 2) return; // Need at least 2 unique modals
          
          // Open all modals with unique data
          const modalDataMap = new Map();
          for (let i = 0; i < uniqueNames.length; i++) {
            const data = { index: i, name: uniqueNames[i] };
            modalDataMap.set(uniqueNames[i], data);
            store.openModal(uniqueNames[i], data);
          }
          
          // Close one modal
          const indexToClose = closeIndex % uniqueNames.length;
          const nameToClose = uniqueNames[indexToClose];
          store.closeModal(nameToClose);
          
          // Property: Closed modal is closed
          expect(store.isModalOpen(nameToClose)).toBe(false);
          expect(store.getModalData(nameToClose)).toBeNull();
          
          // Property: Other modals are unaffected
          for (let i = 0; i < uniqueNames.length; i++) {
            if (i !== indexToClose) {
              expect(store.isModalOpen(uniqueNames[i])).toBe(true);
              expect(store.getModalData(uniqueNames[i])).toEqual(modalDataMap.get(uniqueNames[i]));
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
