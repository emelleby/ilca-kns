# Story 1.1: Critical User Journey Tests

## Status
Draft

## Story Title
Automated Testing for Critical User Journeys - Brownfield Testing Foundation

## User Story
As a development team member,
I want automated tests for login, profile management, and basic navigation,
So that existing functionality is verified and regressions are prevented during brownfield enhancements.

## Story Context

**Existing System Integration:**

- Integrates with: Existing RedwoodSDK app routes, authentication system (email/password), and user profile components
- Technology: Vitest for unit/integration tests, potentially Playwright for E2E; Cloudflare Workers/D1 for backend verification
- Follows pattern: Existing test patterns in src/app/components and src/app/pages (e.g., ClientErrorBoundary, ProfileEditForm tests if present)
- Touch points: Authentication flows (src/app/auth), user pages (src/app/pages/user), layout components (src/app/layouts)

## Acceptance Criteria

**Functional Requirements:**

1. Automated tests cover login flow: successful login, error handling for invalid credentials, redirect to home after login. Specifics: Mock successful auth response from src/app/auth/email.ts; test invalid credentials returns 401 with error message; verify redirect to /home on success.
2. Tests for profile management: viewing profile, editing basic details (name, email), saving changes without errors. Specifics: Use @testing-library/react to render ProfileEditForm; simulate form submission with valid data; assert API call to update profile succeeds without errors.
3. Tests for basic navigation: sidebar menu clicks, route transitions, no broken links in core paths (/home, /user/profile). Specifics: Test HomeLayout sidebar clicks trigger correct route changes; use MemoryRouter for navigation testing; verify no 404s on core paths.
4. Tests include basic error cases: network failure simulation, invalid form inputs. Specifics: Mock fetch failures for auth/profile APIs; test form validation errors for invalid email/name; ensure user-friendly error messages display.

**Integration Requirements:**
5. Existing authentication continues to work unchanged (no impact on src/app/auth/email.ts or password.ts). Specifics: Integration tests verify auth endpoints return expected responses; no schema changes required for testing.
6. New tests follow existing Vitest patterns in src/app/components (e.g., rendering and interaction tests). Specifics: Place tests in __tests__ folders adjacent to components (e.g., src/app/pages/user/__tests__/Login.test.tsx); use render, fireEvent from @testing-library/react.
7. Integration with database (Prisma/D1) maintains current behavior for user data fetches. Specifics: Mock Prisma queries with vi.mock('src/db'); test that profile fetch returns expected User/Profile data structure from schema.prisma.

**Quality Requirements:**
8. Tests are covered by Vitest setup and pass on CI (if configured) or local run. Specifics: Run with `pnpm test`; coverage >80% for tested components; add to package.json scripts if needed.
9. Update README.md or docs/reference if new testing guidelines are added. Specifics: Add section to docs/architecture.md on Vitest setup for Workers/D1 mocking.
10. No regression in existing functionality verified via manual smoke test post-implementation. Specifics: Manual checklist: login/logout, profile view/edit, navigate core paths; run full app and verify no breaks.

## Technical Notes
- **Integration Approach:** Add tests to existing test files under src/app/pages/user and src/app/components; use Vitest's render and fireEvent for component tests; mock API calls to /api/user endpoints. Pull from architecture: Follow RedwoodSDK patterns with server component testing via mocking requestInfo.ctx (see docs/architecture.md#redwood-sdk-patterns). For navigation, use MemoryRouter from react-router-dom to test route transitions without full app render.
- **Existing Pattern Reference:** Follow patterns from src/app/components/ProfileEditForm.tsx (render and userEvent simulation) or standard RedwoodSDK Vitest examples in docs/reference/workflows. Mock D1/Prisma as per techContext.md: Use vi.mock('@prisma/client') for database interactions; example: vi.mock('src/db', () => ({ getPrisma: () => ({ user: { findUnique: vi.fn() } }) })).
- **Key Constraints:** Tests must run in < 30 seconds total; no external dependencies beyond existing stack (Vitest, React Testing Library); focus on happy path + 2-3 error scenarios. Align with Workers limits: Avoid real DB calls; use in-memory mocks. Reference memory-bank/redwoodSDKPatterns.md for Promise handling in mocks to prevent hanging promises.
- **Security Considerations:** Tests must cover auth vulnerabilities: Simulate session hijacking by mocking invalid tokens; verify profile data sanitization prevents XSS (e.g., test invalid inputs don't execute scripts). Align with PRD's dual auth: Test both WebAuthn fallback and email/password error paths without exposing sensitive data.
- **Testing Details:** Use vi.mock for external services (e.g., Resend email mocks if auth tests trigger); provide test data: Mock users with id: 'test-user', email: 'test@example.com', profile with sailing fields. For CI: Integrate with existing pnpm test; aim for 85% coverage on auth/profile components.

## Tasks / Subtasks
- [ ] Task 1: Setup Vitest testing environment (AC8)
  - [ ] Verify/install Vitest and @testing-library/react dependencies (if not present)
  - [ ] Configure vitest.config.ts for RedwoodSDK compatibility (mock Workers env, e.g., vi.mock('cloudflare:workers'))
  - [ ] Add test script to package.json: "test": "vitest" and "test:coverage": "vitest --coverage"
- [ ] Task 2: Implement login flow tests (AC1,4; Security: auth errors)
  - [ ] Create src/app/pages/user/__tests__/Login.test.tsx
  - [ ] Test successful login: render Login component, fireEvent submit with valid creds (mock user data), assert redirect to /home
  - [ ] Test invalid credentials: Mock 401 response from src/app/auth/email.ts, assert error message "Invalid credentials" displays, no redirect
  - [ ] Test network failure: Mock fetch error (vi.mock('fetch')), assert loading spinner shows then error toast
  - [ ] Security: Test session hijacking simulation – mock invalid token, assert logout and redirect to login
- [ ] Task 3: Implement profile management tests (AC2,4; Security: data validation)
  - [ ] Create src/app/components/__tests__/ProfileEditForm.test.tsx
  - [ ] Test profile view: Render ProfileView with mocked user fetch (from src/db.ts), assert sailing fields (e.g., boatType) display correctly
  - [ ] Test edit/save: Simulate form changes (name, email), userEvent.click submit, mock successful PUT to /api/user/profile, assert success message, no errors
  - [ ] Test invalid inputs: Submit invalid email (e.g., "invalid"), assert validation error "Invalid email format"; test XSS prevention by submitting <script>alert(1)</script>, assert sanitized output
- [ ] Task 4: Implement navigation tests (AC3)
  - [ ] Create src/app/layouts/__tests__/HomeLayout.test.tsx
  - [ ] Test sidebar clicks: Render with MemoryRouter, userEvent.click menu item for /user/profile, assert router navigates correctly
  - [ ] Test core path links: Verify <Link to="/home"> doesn't throw, simulate click, assert no broken routes; same for /user/profile
- [ ] Task 5: Verify integration and no regressions (AC5-7,10)
  - [ ] Run integration tests: Mock auth endpoints (vi.mock('../auth/email.ts')), verify unchanged behavior (e.g., login still calls existing functions)
  - [ ] Mock Prisma/D1 queries (vi.mock('@prisma/client')), test user data fetches maintain current schema behavior (e.g., Profile includes clubAffiliation)
  - [ ] Manual smoke test: Run `pnpm dev`, test login/profile/nav manually; verify no console errors or broken functionality post-tests
- [ ] Task 6: Update documentation and run full suite (AC9)
  - [ ] Add testing guidelines to docs/architecture.md: Section on "Vitest Setup for Workers" with mocking examples for D1/Prisma
  - [ ] Run `pnpm test`, ensure >85% coverage on auth/profile/nav components, all pass locally (including new mocks)
  - [ ] If CI configured (e.g., GitHub Actions), add test step to workflow; verify passes in staging

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-18 | 1.0 | Initial story draft with ACs and notes | Product Owner |
| 2025-09-18 | 1.1 | Added missing sections and granular tasks post-validation | Sarah (PO) |

## Definition of Done
- [ ] Functional requirements met (tests written and passing)
- [ ] Integration requirements verified (existing auth/profile flows unchanged)
- [ ] Existing functionality regression tested (run full test suite)
- [ ] Code follows existing patterns and standards (Vitest best practices)
- [ ] Tests pass (existing and new) on local environment
- [ ] Documentation updated if applicable (add to testing section in docs/architecture.md)

## Risk and Compatibility Check

**Minimal Risk Assessment:**

- **Primary Risk:** Tests could introduce flakiness if not mocking external services properly (e.g., D1 queries). Secondary: Over-reliance on mocks might miss real integration issues.
- **Mitigation:** Use Vitest mocks for API calls and database interactions; focus on deterministic tests. Add integration tests with real D1 mocks; run against staging env periodically.
- **Rollback:** Delete the new test files; no code changes to production paths.

**Compatibility Verification:**
- [x] No breaking changes to existing APIs (tests only)
- [x] Database changes (if any) are additive only (none required)
- [x] UI changes follow existing design patterns (no UI changes)
- [x] Performance impact is negligible (tests run on dev/CI only)

This story is now ready for development. It's scoped for a single session (~8 hours as estimated in the risk plan).

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### Debug Log References
Reference any debug logs or traces generated during development.

### Completion Notes List
Notes about the completion of tasks and any issues encountered.

### File List
List all files created, modified, or affected during story implementation.

## QA Results

### Review Date: 2025-09-18

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

This is a planning story for implementing foundational automated tests in a brownfield RedwoodSDK application. No code implementation has occurred yet; the story defines clear requirements for test coverage of critical user journeys (login, profile management, navigation). The story is well-structured, with detailed acceptance criteria, technical notes, and risk assessment. It aligns with the overall architecture by focusing on Vitest for unit/integration tests and potential Playwright for E2E, emphasizing mocks for API/DB interactions to avoid flakiness.

### Refactoring Performed

No refactoring performed as this is a documentation/planning artifact. No code files modified.

### Compliance Check

- Coding Standards: [✓] N/A (no code changes); story follows documentation patterns from docs/architecture.md
- Project Structure: [✓] Story file follows standard format in docs/stories/; references existing src/app structure correctly
- Testing Strategy: [✗] No existing testing-strategy.md file; story proposes Vitest patterns consistent with RedwoodSDK best practices (e.g., render/fireEvent for components, mocks for APIs)
- All ACs Met: [✓] All 10 ACs are clearly defined and scoped appropriately for implementation; functional, integration, and quality requirements are comprehensive

### Improvements Checklist

- [x] Verified story aligns with brownfield constraints (no breaking changes to existing auth/profile)
- [x] Confirmed test approach uses existing Vitest setup (no new dependencies needed)
- [ ] Implement tests as per ACs 1-4 (login, profile, navigation coverage)
- [ ] Add E2E tests if Playwright integration is pursued (beyond basic Vitest)
- [ ] Document test execution guidelines in a new docs/testing-strategy.md after implementation

### Security Review

No security concerns in planning. When implemented, ensure tests cover auth error handling (AC1,4) and profile data validation to prevent injection/vulnerabilities. Recommend adding tests for session hijacking simulation in integration layer.

### Performance Considerations

Tests scoped to run <30s total (per technical notes). Recommend mocking heavy DB queries (Prisma/D1) to keep execution fast. No performance issues in planning phase.

### Files Modified During Review

None (planning story only).

### Gate Status

Gate: PASS → docs/qa/gates/1.1-critical-user-journey-tests.yml
Risk profile: docs/qa/assessments/1.1-risk-20250918.md (medium-high risk due to foundational nature; score 7/10)
NFR assessment: docs/qa/assessments/1.1-nfr-20250918.md (all PASS for planning; implementation to validate)

### Recommended Status

### Traceability Summary
Trace matrix: docs/qa/assessments/1.1-trace-20250918.md
- Full coverage for core functional ACs (1-4,6-8,10) with unit/integration mappings using Given-When-Then for validation
- Partial for verification ACs (5,9); gaps are low-risk and addressed via tasks/manual steps
- No uncovered requirements; 80% full coverage, strong risk mitigation through mocks and specifics
- Recommendations: Add explicit integration test for AC5 during Task 5; verify doc update in AC9 post-implementation



### Final Gate Review Date: 2025-09-18

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Final review confirms excellent test planning. ACs are testable with specifics; tasks granular and sequenced; traceability matrix shows 80% full coverage with low-risk gaps. Aligns with architecture/PRD; no issues for planning phase. High confidence for dev.

### Refactoring Performed

N/A – planning artifact.

### Compliance Check

- Coding Standards: [✓] N/A
- Project Structure: [✓] N/A
- Testing Strategy: [✓] Comprehensive planning aligns.
- All ACs Met: [✓] Planning ACs fully addressed.

### Improvements Checklist

- [x] All items addressed in planning.

### Security Review

Planning solid; implementation to verify.

### Performance Considerations

Planning addresses constraints.

### Files Modified During Review

None.

### Gate Status

Gate: PASS (documented here; .yml restricted). See trace matrix for details.

### Recommended Status

[✓ Ready for Development] – Full traceability and planning; proceed.
[✓ Ready for Development] - Story is complete as planning artifact with full traceability. All ACs mapped to tests with Given-When-Then validation; 80% full coverage, minor gaps mitigated via tasks. Proceed to implementation with high confidence in test architecture. Trace matrix reference: docs/qa/assessments/1.1-trace-20250918.md