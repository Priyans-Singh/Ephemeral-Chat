# Integration Tests

This directory contains comprehensive integration tests for the enhanced chat UI components.

## Test Files

- `user-flows.test.tsx` - End-to-end user flow tests covering authentication, chat functionality, theme switching, and error handling
- `enhanced-components.test.tsx` - Integration tests specifically for enhanced ShadCN components and their interactions
- `setup.ts` - Test setup and utilities for integration tests

## Running Integration Tests

To run all integration tests:
```bash
npm test -- src/test/integration
```

To run specific integration test files:
```bash
npm test -- src/test/integration/user-flows.test.tsx
npm test -- src/test/integration/enhanced-components.test.tsx
```

## Test Coverage

### User Flows (`user-flows.test.tsx`)
- Complete authentication flow from login to chat
- Form switching with animations
- Real-time validation feedback
- Theme persistence across page reloads
- Reduced motion preferences
- End-to-end chat functionality
- Sidebar collapse/expand with animations
- Message sending with validation
- Typing indicators and user presence
- Responsive design adaptation
- Accessibility compliance (focus management, ARIA labels)
- Error handling (network errors, authentication errors)

### Enhanced Components (`enhanced-components.test.tsx`)
- Enhanced authentication forms with animations
- Form switching animations
- Real-time validation with enhanced feedback
- Enhanced sidebar with search and filtering
- Settings dropdown with theme toggle
- User selection with animations
- Logout confirmation UX
- Enhanced chat layout with animations
- Theme integration across components
- Animation preferences respect
- Accessibility in enhanced components
- Performance of enhanced components

## Test Utilities

The `setup.ts` file provides:
- Mock implementations for browser APIs
- Mock contexts for Auth, Theme, and Sidebar
- Utility functions for creating test data
- Common test configuration

## Key Features Tested

1. **Enhanced UI Components**
   - ShadCN component integration
   - Framer Motion animations
   - Theme system integration
   - Responsive design

2. **User Experience**
   - Smooth transitions and animations
   - Real-time validation feedback
   - Loading states and error handling
   - Accessibility compliance

3. **Integration Points**
   - Component communication
   - State management across contexts
   - Event handling and user interactions
   - API integration and error handling

4. **Performance**
   - Component render performance
   - Animation performance
   - Memory usage optimization
   - Bundle size considerations

## Notes

- Tests use mocked dependencies to isolate component behavior
- Integration tests focus on component interactions rather than unit-level testing
- Tests verify both functionality and user experience aspects
- Accessibility testing ensures WCAG compliance
- Performance tests validate optimization requirements