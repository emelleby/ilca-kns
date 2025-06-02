Organization and RBAC Implementation Plan
Database Schema Changes
Create Organization model in Prisma schema
Add fields: name, description, createdAt, updatedAt
Create OrganizationMembership model to link users to organizations
Add fields: userId, organizationId, role, joinedAt
Add organization relationship to User model
Role Management
Define organization-specific roles:
Owner/Admin (full control of organization)
Coach (manage assigned users)
Member (regular user in organization)
Implement role hierarchy and inheritance
Ensure Admin inherits Coach permissions
Ensure Coach inherits Member permissions
Organization Management
Create superuser functionality to create organizations
Implement organization admin assignment
Build organization admin dashboard
Member management interface
Role assignment controls
Invitation System
Create invitation model in database
Add fields: email, organizationId, role, status, expiresAt
Implement invitation creation by organization admins
Build email notification system for invitations
Create invitation acceptance workflow
Permission Middleware
Create organization-aware interruptors
requireOrganizationAdmin interruptor
requireOrganizationCoach interruptor
requireOrganizationMember interruptor
Implement permission checking for organization resources
API Endpoints
Organization management endpoints
Create organization (superuser only)
Update organization details
Delete organization
Membership management endpoints
Invite user to organization
Accept/reject invitation
Update member role
Remove member
Organization data access endpoints
Get organization details
List organization members
List user's organizations
UI Components
Organization management pages
Organization creation form
Organization settings page
Member management interface
Invitation management components
Send invitation form
Invitation list view
Accept invitation page
Testing
Test organization creation and management
Test invitation system
Test role-based access control within organizations
Verify proper permission enforcement for organization resources
This plan aligns with Task 5's requirements for role-based access control while extending it to support organization-level permissions and management.