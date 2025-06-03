# Task 5: Organization and RBAC Implementation Plan

## Database Schema Changes
- [x] Create Organization model in Prisma schema
- [x] Add fields: name, description, createdAt, updatedAt
- [x] Create OrganizationMembership model to link users to organizations
- [x] Add fields: userId, organizationId, role, joinedAt
- [x] Add organization relationship to User model
- [x] Create invitation model in database
- [x] Add fields: email, organizationId, role, status, expiresAt

## Role Management
- [ ] Define organization-specific roles:
  - [ ] Owner/Admin (full control of organization)
  - [ ] Coach (manage assigned users)
  - [ ] Member (regular user in organization)
- [ ] Implement role hierarchy and inheritance
  - [ ] Ensure Admin inherits Coach permissions
  - [ ] Ensure Coach inherits Member permissions

## Organization Management (SUPERUSER Interface)
- [x] Create superuser functionality to create organizations (COMPLETE)
- [ ] Implement organization admin assignment
- [x] Build organization admin dashboard (basic structure)
- [ ] Member management interface
- [ ] Role assignment controls

## Invitation System
- [ ] Implement invitation creation by organization admins
- [ ] Build email notification system for invitations
- [ ] Create invitation acceptance workflow

## Permission Middleware
- [ ] Create organization-aware interceptors
  - [ ] requireOrganizationAdmin interceptor
  - [ ] requireOrganizationCoach interceptor
  - [ ] requireOrganizationMember interceptor
- [ ] Implement permission checking for organization resources

## API Endpoints
### Organization management endpoints
- [ ] Create organization (superuser only)
- [ ] Update organization details
- [ ] Delete organization

### Membership management endpoints
- [ ] Invite user to organization
- [ ] Accept/reject invitation
- [ ] Update member role
- [ ] Remove member

### Organization data access endpoints
- [ ] Get organization details
- [ ] List organization members
- [ ] List user's organizations

## UI Components
### Organization management pages
- [ ] Organization creation form (SUPERUSER only)
- [ ] Organization settings page
- [ ] Member management interface

### Invitation management components
- [ ] Send invitation form
- [ ] Invitation list view
- [ ] Accept invitation page

## Testing
- [ ] Test organization creation and management
- [ ] Test invitation system
- [ ] Test role-based access control within organizations
- [ ] Verify proper permission enforcement for organization resources

---

This plan aligns with Task 5's requirements for role-based access control while extending it to support organization-level permissions and management.