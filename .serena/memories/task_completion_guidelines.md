# Task Completion Guidelines - ILCA-KNS Project

## When a Task is Completed

After implementing features or making changes to the codebase, follow this checklist to ensure quality and proper deployment.

## Pre-Commit Checklist

### 1. Code Quality Verification
```bash
# Type checking (mandatory)
pnpm types

# Generate Prisma client and Wrangler types
pnpm generate

# Full check (includes type checking and generation)
pnpm check
```

### 2. Build Verification
```bash
# Ensure the application builds successfully
pnpm build

# Check that no build errors occur
# Verify bundle size is reasonable for Cloudflare Workers
```

### 3. Database Migration Verification
```bash
# If database schema was modified:
pnpm migrate:new  # Create migration if needed
pnpm migrate:dev  # Apply locally

# Verify migration works correctly
# Test that existing data is preserved
```

### 4. Manual Testing (Current Approach)

Since automated testing is not yet implemented, perform manual verification:

```bash
# Start development server
pnpm dev
```

**Test Coverage Areas:**
- ✅ **Authentication flows** - Login, signup, logout, WebAuthn
- ✅ **Profile management** - View, edit, privacy settings
- ✅ **Community features** - Post viewing, interactions
- ✅ **Navigation** - All routes accessible, proper redirects
- ✅ **Responsive design** - Mobile, tablet, desktop views
- ✅ **Error handling** - Graceful error states
- ✅ **Role-based access** - USER vs SUPERUSER permissions

**Browser Testing:**
- Chrome/Chromium (primary)
- Firefox
- Safari (if available)
- Mobile browsers

### 5. Performance Verification

```bash
# Check bundle size after build
pnpm build
ls -lh dist/

# Ensure bundle stays within Cloudflare Workers limits
# Monitor for memory usage concerns
```

**Performance Targets:**
- Page load time: < 2 seconds
- Bundle size: Reasonable for Workers limits
- Database queries: Optimized with proper includes
- Image optimization: Appropriate formats and sizes

## Deployment Process

### Local to Production Pipeline

1. **Final Local Testing**
   ```bash
   pnpm clean
   pnpm install
   pnpm generate
   pnpm migrate:dev
   pnpm dev
   # Comprehensive manual testing
   ```

2. **Production Migration** (if database changes)
   ```bash
   # Apply migrations to production D1
   pnpm migrate:prd
   ```

3. **Production Deployment**
   ```bash
   # Full deployment pipeline
   pnpm release
   ```

4. **Post-Deployment Verification**
   ```bash
   # Monitor deployment
   wrangler tail
   
   # Test production site
   # Verify all features work in production
   # Check error rates and performance
   ```

## Code Review Standards

### Before Committing Code

- **TypeScript compliance** - All code must pass `pnpm types`
- **RedwoodSDK patterns** - Follow established server/client component patterns
- **Database best practices** - Proper relationships, migrations, error handling
- **UI consistency** - Matches existing Shadcn/UI and Tailwind patterns
- **Mobile responsiveness** - Works on all screen sizes
- **Accessibility** - Basic ARIA labels and semantic HTML

### Git Workflow

```bash
# Pre-commit verification
pnpm types
pnpm build

# Commit with conventional commit format
git add .
git commit -m "feat: implement user profile editing"
git push

# Deploy when ready
pnpm release
```

## Documentation Updates

After significant changes, update relevant documentation:

### Code-Level Documentation
- Update component props interfaces
- Add JSDoc comments for complex functions
- Update database schema comments
- Document new environment variables

### Project Documentation
- Update memory bank files if architecture changes
- Document new features in appropriate files
- Update API patterns if new endpoints added
- Note any breaking changes

## Rollback Procedures

### If Deployment Fails

1. **Quick Rollback via Wrangler**
   ```bash
   # Rollback to previous deployment
   wrangler rollback
   ```

2. **Database Rollback** (if needed)
   ```bash
   # Manually reverse database migrations if critical issue
   # This should be rare with additive-only migrations
   ```

3. **Fix and Redeploy**
   ```bash
   # Fix the issue locally
   pnpm dev  # Test fix
   pnpm types  # Verify
   pnpm release  # Redeploy
   ```

## Quality Assurance Checklist

### Functional Requirements
- [ ] All new features work as specified
- [ ] Existing features remain functional
- [ ] Authentication flows unbroken
- [ ] Database operations succeed
- [ ] Email notifications work (if applicable)
- [ ] File uploads work (if applicable)

### Technical Requirements
- [ ] TypeScript compilation succeeds
- [ ] Build process completes without errors
- [ ] Database migrations apply cleanly
- [ ] No console errors in browser
- [ ] Responsive design maintained
- [ ] Performance within acceptable limits

### Security Requirements
- [ ] Authentication checks in place
- [ ] Authorization working correctly
- [ ] User data properly protected
- [ ] SQL injection prevention (via Prisma)
- [ ] XSS prevention (via React)
- [ ] CSRF protection (via session system)

## Monitoring and Maintenance

### Post-Deployment Monitoring

```bash
# Watch real-time logs
wrangler tail

# Check error rates
# Monitor performance metrics
# Verify database performance
```

### Regular Maintenance Tasks

- **Weekly:** Check for dependency updates
- **Monthly:** Review error logs and performance
- **Quarterly:** Security audit and dependency security updates
- **As needed:** Database optimization and cleanup

### Incident Response

1. **Detect** - Monitor logs and user reports
2. **Assess** - Determine severity and impact
3. **Respond** - Fix immediately or rollback
4. **Document** - Record incident and resolution
5. **Prevent** - Implement measures to prevent recurrence

## Testing Strategy (Future Implementation)

### Recommended Testing Framework
When implementing automated testing:

- **Unit tests** - Vitest for utility functions
- **Component tests** - React Testing Library
- **Integration tests** - Database operations
- **E2E tests** - Playwright for critical user journeys

### Test Coverage Priorities
1. Authentication and authorization
2. Database operations and migrations
3. Form submissions and validations
4. API endpoints and server functions
5. User interface interactions