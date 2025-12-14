# Dashboard Refactoring Documentation

## Overview

This directory contains comprehensive documentation for refactoring the Family Command Center frontend from a monolithic Vue application into a modular, widget-based dashboard system.

## Documentation Files

### 1. [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md)
**Purpose**: Understand the existing system

**Contents**:
- Current technology stack
- Component hierarchy
- State management patterns
- API integration
- Pain points and issues
- Strengths to preserve

**Read this first** to understand what we're working with.

---

### 2. [COMPONENT_DEPENDENCY_MAP.md](./COMPONENT_DEPENDENCY_MAP.md)
**Purpose**: Visualize component relationships and dependencies

**Contents**:
- Visual dependency graph
- Detailed component dependencies
- $parent method call inventory
- Provide/inject usage matrix
- Coupling scores
- Refactoring priorities

**Use this** to identify what needs to change for each component.

---

### 3. [REFACTORING_ROADMAP.md](./REFACTORING_ROADMAP.md)
**Purpose**: Strategic plan for the migration

**Contents**:
- Phase-by-phase breakdown (5 phases, 10 weeks)
- Setup instructions for Pinia
- Store creation guide
- Widget migration order
- Dashboard implementation plan
- Success metrics

**Follow this** for the high-level strategy and timeline.

---

### 4. [WIDGET_INTERFACE_SPEC.md](./WIDGET_INTERFACE_SPEC.md)
**Purpose**: Technical contract for all widgets

**Contents**:
- Widget metadata structure
- Component definition template
- Configuration schema
- WidgetBase mixin documentation
- Styling guidelines
- Example implementations
- Testing requirements

**Reference this** when creating or converting widgets.

---

### 5. [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
**Purpose**: Step-by-step migration instructions

**Contents**:
- Quick reference table
- Store migration steps
- Component migration steps
- Widget conversion steps
- Common patterns
- Troubleshooting guide
- Best practices

**Use this** as your hands-on guide during development.

---

## Quick Start

### If You're New to the Project

1. Read `CURRENT_ARCHITECTURE.md` to understand the existing system
2. Review `COMPONENT_DEPENDENCY_MAP.md` to see the relationships
3. Read `REFACTORING_ROADMAP.md` to understand the overall plan

### If You're Ready to Start Coding

1. Follow Phase 0 in `REFACTORING_ROADMAP.md` to set up infrastructure
2. Use `MIGRATION_GUIDE.md` for step-by-step migration instructions
3. Reference `WIDGET_INTERFACE_SPEC.md` when creating widgets

### If You're Migrating a Specific Component

1. Check `COMPONENT_DEPENDENCY_MAP.md` to see current dependencies
2. Follow the migration steps in `MIGRATION_GUIDE.md`
3. Use `WIDGET_INTERFACE_SPEC.md` to structure your widget

---

## Key Decisions

### State Management: Pinia ✓
- Vue 3-native
- Excellent modularity for widgets
- Smaller bundle size than Vuex
- Better DevTools support
- Can run alongside current system during migration

### Widget Storage: Backend API ✓
- Dashboard layouts stored via Account Settings API
- Enables cross-device synchronization
- LocalStorage as offline cache
- User-specific configurations

### Migration Strategy: Gradual ✓
- Both old and new systems run simultaneously
- Migrate one component at a time
- Test thoroughly before removing old code
- Can rollback individual features if needed

---

## Architecture Goals

### Primary Goals
1. ✅ User-configurable dashboard with add/remove widgets
2. ✅ Independent, testable components
3. ✅ Eliminate tight coupling ($parent access)
4. ✅ Improve performance through code splitting
5. ✅ Enable easier feature development

### Technical Goals
1. ✅ Zero `$parent` calls in widgets
2. ✅ All state in Pinia stores
3. ✅ Event-driven communication
4. ✅ 100% widget test coverage
5. ✅ Maintain GitHub Pages deployment

---

## Phase Summary

| Phase | Duration | Focus                    | Status      |
|-------|----------|--------------------------|-------------|
| 0     | 1 week   | Setup & Infrastructure   | Not Started |
| 1     | 2 weeks  | Core Stores              | Not Started |
| 2     | 1 week   | Widget Base System       | Not Started |
| 3     | 3 weeks  | Widget Migration         | Not Started |
| 4     | 2 weeks  | Dashboard Page           | Not Started |
| 5     | 1 week   | Polish & Optimization    | Not Started |

**Total Timeline**: 8-12 weeks

---

## Success Metrics

### Technical Metrics
- Zero `$parent` calls in widgets
- All state in stores
- 100% widget test coverage
- Load time < 3s
- Bundle size < current + 50KB

### User Metrics
- Dashboard customization used by 50%+ users
- Average 5+ widgets per dashboard
- Positive user feedback
- No increase in bug reports

### Developer Metrics
- New widget in < 2 hours
- Components 80% smaller
- State changes trackable in devtools
- Faster feature development

---

## Architecture Diagrams

### Current Architecture (Monolithic)
```
┌─────────────────────────────────────┐
│           app.js (ROOT)             │
│     All state, all methods          │
│          2,652 lines                │
└──────────────┬──────────────────────┘
               │
               │ $parent calls everywhere
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
  Pages    Sections    Modals
    │          │          │
    └──────────┴──────────┘
         All tightly coupled
```

### Target Architecture (Modular)
```
┌──────────────────────────────────────┐
│         Pinia Stores                 │
│  (State Management)                  │
│  ├── useAuthStore                    │
│  ├── useChoresStore                  │
│  ├── useShoppingStore                │
│  ├── useFamilyStore                  │
│  ├── useUIStore                      │
│  └── useDashboardStore               │
└──────────────┬───────────────────────┘
               │
               │ Store actions/getters
               │
┌──────────────┴───────────────────────┐
│         Dashboard Shell              │
│    (Widget Container)                │
└──────────────┬───────────────────────┘
               │
               │ Widget instances
               │
    ┌──────────┼──────────┬──────────┐
    ▼          ▼          ▼          ▼
  Widget A   Widget B  Widget C  Widget D
    │          │          │          │
    └──────────┴──────────┴──────────┘
      Independent, self-contained
```

---

## Widget Examples

### Simple Widget
- **Family Member Earnings**: Display earnings for one member
- **Quick Actions**: Customizable action buttons
- **Weather**: External API widget (future)

### Medium Complexity
- **Shopping List**: Grouped shopping items
- **Quicklist**: Common chores for quick assignment
- **Spending Requests**: Parent approval queue

### Complex Widget
- **Family Member Chores**: Full chore management for one member
- **Chore Progress Chart**: Historical data visualization
- **Calendar**: Schedule and events (future)

---

## Development Workflow

### 1. Planning
- Identify component to migrate
- Check dependency map
- Determine required stores
- Plan widget structure

### 2. Implementation
- Create/update stores as needed
- Convert component to widget
- Add configuration schema
- Implement lifecycle hooks
- Style responsively

### 3. Testing
- Unit test store logic
- Integration test widget
- Manual browser testing
- Mobile testing
- Accessibility testing

### 4. Review
- Code review with team
- Documentation review
- Performance check
- UX review

### 5. Deploy
- Merge to main branch
- Deploy to staging
- User acceptance testing
- Deploy to production

---

## Getting Help

### Resources
- **Pinia Documentation**: https://pinia.vuejs.org/
- **Vue 3 Documentation**: https://vuejs.org/
- **Team Chat**: #dashboard-refactor
- **Code Reviews**: Required for all changes

### Common Issues
See `MIGRATION_GUIDE.md` Troubleshooting section for:
- Store undefined errors
- Reactivity issues
- $parent still referenced
- Performance problems

---

## Contributing

### Pull Request Checklist
- [ ] Code follows migration guide
- [ ] No `$parent` access in new code
- [ ] Store actions used for state changes
- [ ] Widget metadata complete
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed by team
- [ ] Manual testing complete

### Review Criteria
- Adherence to widget interface spec
- Proper use of Pinia stores
- Error handling implemented
- Loading states implemented
- Responsive design
- Accessible (ARIA labels, keyboard nav)

---

## Next Steps

### Immediate Actions
1. **Review all documentation** (2-3 hours)
2. **Set up development environment** (Phase 0)
3. **Create first store** (useAuthStore)
4. **Test Pinia integration** (verify devtools work)

### Week 1 Goals
- Complete Phase 0 (Setup & Infrastructure)
- All stores defined (empty is fine)
- Base API service working
- Widget base mixin created
- Team aligned on approach

### Month 1 Goals
- Complete Phase 0 and Phase 1
- All core stores implemented
- Parallel system working
- First test widget created
- Team comfortable with new patterns

---

## FAQ

**Q: Why Pinia instead of Vuex?**
A: Pinia is Vue 3-native, has better TypeScript support, simpler API, and smaller bundle size. It's the recommended state management solution for Vue 3.

**Q: Why gradual migration?**
A: Gradual migration reduces risk, allows for thorough testing at each step, and ensures the app remains functional throughout the process.

**Q: Will this affect deployment?**
A: No! Both Pinia and Vuex work fine with GitHub Pages. It's all client-side JavaScript.

**Q: How long will this take?**
A: 8-12 weeks total, but the app remains functional throughout. Users won't notice the migration.

**Q: What if something breaks?**
A: The old system stays in place until Phase 5, allowing easy rollback. Each change is incremental and reversible.

**Q: Can we add new features during migration?**
A: Yes! New features should be built as widgets using the new system.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0     | 2024-10-16 | Initial documentation created |

---

## Maintainers

This documentation is maintained by the Family Command Center development team. For questions or suggestions, please reach out in the #dashboard-refactor channel.

---

## License

This documentation is part of the Family Command Center project and follows the same license as the main project.

