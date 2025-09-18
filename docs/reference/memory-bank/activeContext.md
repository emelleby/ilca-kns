# Active Context

## Current Focus

- ✅ **Completed Task 4: User Profile Management**
- ✅ Built comprehensive profile creation, editing, and viewing functionality
- ✅ Integrated sailing-specific features (experience, certifications, boat information)
- ✅ Implemented password reset functionality
- ✅ **Resolved Cloudflare Workers compatibility issues**
- ✅ **Completed Story 1.1: Critical User Journey Tests** - Automated Vitest tests for login, profile, navigation; ensures regression-free development
- ✅ **Completed Story 1.1.5: Light Integration Tests** - 4 tests in src/app/pages/user/__tests__/integration.test.tsx for multi-component flows (login → profile view, profile edit → save → navigation, error handling); mocks for auth/DB/router; >85% coverage (ProfileEditForm 96.57%, Login 91.79%, ProfileView 91.53%), ~7s runtime, full suite 47 tests passing; QA passed with excellent quality, no regressions
- Ready to move to next phase: Activity tracking and community features with solid testing foundation

## Recent Changes

- Enhanced Profile model with sailing-specific fields (sailingExperience, certifications, boatInformation, clubAffiliation)
- Created comprehensive profile management system with functions for CRUD operations
- Built ProfileSetup component for new user onboarding
- Implemented ProfileView component for displaying user profiles with privacy controls
- Created ProfileEdit component for updating profile information
- Added profile routes to user routing system
- Updated navigation to include profile links
- Created missing UI components (Select, Checkbox, Textarea) for profile forms
- **Implemented auto-profile creation system:**
  - Profiles are automatically created during user registration (both passkey and password)
  - Profiles are auto-created when users access their profile page if none exists
  - Uses available user information (username, email, club) to populate initial profile
  - Eliminates "no profile found" scenarios for better UX
- Implemented password reset functionality with email notifications
- Set up email sending via Resend API (currently configured for development only)
- **Resolved Cloudflare Workers I/O issues:**
  - Fixed "Only plain objects can be passed to Client Components" errors
  - Implemented proper server-client data flow patterns
  - Created API endpoint approach for client-server communication
  - Established RedwoodSDK best practices for data fetching and component architecture
- **Resolved Cloudflare Workers hanging Promise issues:**
  - Fixed PostList component that was causing "hanging Promise" errors
  - Converted unnecessary async functions to synchronous for static data
  - Fixed TasksPage hot-reload hanging Promise issue by converting from client to server component
  - Created TasksTableClient component to isolate interactive functionality
  - Fixed ErrorBoundary class component instantiation issue by creating ClientErrorBoundary for client components
  - Restructured HomeLayout Suspense boundaries to prevent RSC hot-update errors
  - Implemented dynamic JSON loading to avoid hot-reload module resolution issues
  - Documented comprehensive prevention patterns for future development
  - Established rules for proper Suspense boundary usage with async server components
  - Documented hot-reload specific patterns for client components with server props
- **Implemented Story 1.1: Critical User Journey Tests**:
  - Created Vitest tests for login (src/app/pages/user/__tests__/Login.test.tsx): success, invalid credentials, redirect to /home, network errors, form validation, security scenarios
  - Created Vitest tests for profile management (src/app/components/__tests__/ProfileEditForm.test.tsx): view sailing fields, edit/save, invalid inputs, XSS prevention, certification management, privacy settings
  - Created Vitest tests for navigation (src/app/layouts/__tests__/HomeLayout.test.tsx): sidebar clicks, route transitions, authenticated/unauthenticated menus, no broken links, accessibility
  - Configured vitest.config.ts for RedwoodSDK compatibility (Workers/D1 mocking, jsdom environment, coverage >80%)
  - Updated package.json with test scripts: "test": "vitest", "test:coverage": "vitest --coverage"
  - Added src/test/setup.ts with mocks for cloudflare:workers, rwsdk/worker, session/store, db, crypto, fetch
  - Verified integration: mocked auth/profile APIs and D1/Prisma queries maintain current behavior
  - Updated docs/architecture.md with Vitest setup guidelines for Workers/D1 mocking, component testing patterns, security/accessibility testing
  - Manual smoke tests: login/logout, profile view/edit, navigate core paths (/home, /user/profile) - no breaks, >85% coverage on auth/profile/nav components

- **Implemented Story 1.1.5: Light Integration Tests**:
  - Created src/app/pages/user/__tests__/integration.test.tsx with 4 tests: login → profile view (AC1, sailing fields display), profile edit → save → navigation (AC2, sidebar state preservation), error during save (AC3, alert handling)
  - Mocks: auth functions (loginWithPassword), profile ops (getPublicProfile, updateUserProfile), DB (vi.mock('@/db')), router (MemoryRouter, window.location/history)
  - Used userEvent sequences for realistic interactions; wrapped in providers for multi-component render
  - Verified: Full suite 47 tests pass (~7s), coverage >85% on integrated components; no unit test regressions
  - Updated docs/architecture.md: Added section on multi-component Vitest patterns, mocking shared deps, error propagation
  - QA: Excellent quality (comprehensive mocks, clear structure); fully compliant, secure (no real auth exposure), optimized (<30s); gate passed
  - Files: Created integration.test.tsx; modified docs/architecture.md, story file
  - Agent: Claude Sonnet 4; debug: All existing 43 tests pass, incremental coverage verified

## Key Patterns and Preferences

- Mobile-first design approach
- Role-based access control
- Rich content creation capabilities
- Training progress tracking
- Event management functionality
- Interactive client components require "use client"; directive
- Two-pass rendering pattern implemented for client-side interactivity to prevent hydration errors
- Dual authentication methods (passkey-first with email/password as alternative)
- Prisma workflow: `pnpm migrate:new "migration_name"` for schema changes, followed by server restart
- Email notifications for account-related actions (currently in development mode)
- **RedwoodSDK Data Flow Pattern:**
  - Server components fetch data and serialize for client components
  - Client components handle UI interactions and call API endpoints
  - API routes handle HTTP requests and call server functions
  - Server functions handle database operations (marked with "use server")
  - Use API endpoints instead of direct server function calls from client components for Cloudflare Workers compatibility

## Active Decisions

- Using a linked account approach for authentication methods
- Emphasizing passkey authentication in the UI while providing email/password as an alternative
- Implementing account settings to allow users to add authentication methods
- Using Prisma ORM for database operations with D1 database
- Using Resend API for email delivery
- Development mode for emails: redirecting all emails to a development email address

## Next Steps

- Implement profile picture upload with R2 Storage integration
- Add profile deletion and account management functionality
- Create profile completion prompts for new users
- Develop the personal sailing diary functionality
- Build the community blog/news system
- Add activity statistics display to profiles
