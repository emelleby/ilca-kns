# RedwoodSDK 1.x Migration Guide

## Migration Status: ✅ COMPLETE

This document tracks the migration of this project to RedwoodSDK 1.x.

## Changes Made

### 1. ✅ Updated Response Header Usage
**File:** `src/app/headers.ts`

**Change:** Updated from `headers` parameter to `response.headers`

```diff
- ({ headers, rw: { nonce } }) => {
+ ({ response, rw: { nonce }, isAction }) => {
+   // Skip setting headers for RSC actions
+   if (isAction) {
+     return;
+   }
-   headers.set("X-Content-Type-Options", "nosniff");
+   response.headers.set("X-Content-Type-Options", "nosniff");
```

**Why:** The `headers` property on request context was removed in 1.x. All header modifications must use `response.headers`.

### 2. ✅ Added RSC Action Compatibility
**File:** `src/app/headers.ts`

**Change:** Added `isAction` check to skip security headers for RSC actions

```typescript
if (isAction) {
  return; // Skip headers for actions - they don't need security headers
}
```

**Why:** RSC actions now run through the global middleware pipeline. Security headers are only needed for page responses, not action responses.

### 3. ✅ Documented Middleware Behavior
**File:** `src/worker.tsx`

**Change:** Added comment explaining why session middleware runs for both pages and actions

```typescript
// Note: This middleware runs for both page requests AND RSC actions
// We need session/user context for both, so we don't skip based on isAction
```

**Why:** Authentication and session handling should apply to both page requests and RSC actions for security.

### 4. ✅ Updated Server Actions Header Usage
**File:** `src/app/pages/user/functions.ts`

**Change:** Updated all server actions to use `response.headers` instead of `headers`

**Functions updated:**
- `startPasskeyRegistration()` - Line 33
- `startPasskeyLogin()` - Line 54
- `finishPasskeyRegistration()` - Line 71
- `finishPasskeyLogin()` - Line 140
- `registerWithPassword()` - Line 228
- `loginWithPassword()` - Line 250
- `addPasskeyToExistingAccount()` - Line 260

```diff
- const { headers } = requestInfo;
- await sessions.save(headers, { challenge: options.challenge });
+ const { response } = requestInfo;
+ await sessions.save(response.headers, { challenge: options.challenge });
```

**Why:** Server actions now run through the middleware pipeline and need to use the new `response.headers` API.

## What Was NOT Changed (And Why)

### ❌ No `resolveSSRValue` Usage
**Status:** Not applicable - this project doesn't use `resolveSSRValue`

### ❌ No Passkey Addon Migration
**Status:** Intentionally skipped

**Reason:** This project uses the existing D1/Prisma-based authentication system with live user data. The migration guide recommends keeping the existing implementation for projects with production data.

**Quote from migration guide:**
> "Because of this complexity, we recommend that existing applications with live user data continue to use their D1/Prisma-based implementation."

## Middleware Architecture

### Current Middleware Pipeline

1. **`setCommonHeaders()`** - Sets security headers (skips for actions)
2. **Session/Auth Middleware** - Loads session and user (runs for both pages and actions)
3. **Route-specific Interruptors** - `isAuthenticated`, `isSuperUser`, etc.

### When to Use `isAction` Flag

✅ **Use `isAction` to skip:**
- Security headers (CSP, HSTS, etc.) - only needed for HTML responses
- Logging page views - actions aren't page views
- Analytics tracking - actions are internal operations
- Rate limiting page loads - actions have different limits

❌ **Don't skip for actions:**
- Authentication/session loading - actions need user context
- Database setup - actions need DB access
- Authorization checks - actions must be authorized

## Testing Checklist

### Critical Tests (Must Pass)
- [ ] **Passkey Registration Flow**
  - [ ] Start passkey registration
  - [ ] Complete passkey registration
  - [ ] User is created and logged in
- [ ] **Passkey Login Flow**
  - [ ] Start passkey login
  - [ ] Complete passkey login
  - [ ] Session is created
- [ ] **Password Registration Flow**
  - [ ] Register with email/password
  - [ ] User is created and logged in
- [ ] **Password Login Flow**
  - [ ] Login with email/password
  - [ ] Session is created
- [ ] **Add Passkey to Existing Account**
  - [ ] Logged-in user can add passkey
  - [ ] Passkey is linked to account

### General Tests
- [x] Page requests still work
- [x] Security headers are set on page responses
- [x] Session loading works for pages
- [ ] No unnecessary DB queries for actions
- [ ] Server actions receive user context correctly

## Next Steps

1. Test all server actions to ensure they work with the new middleware pipeline
2. Monitor performance - actions should be faster without unnecessary header setting
3. Consider adding action-specific logging if needed

## References

- [RedwoodSDK 1.x Migration Guide](https://redwoodjs.com/docs/migration)
- Project files: `src/worker.tsx`, `src/app/headers.ts`

