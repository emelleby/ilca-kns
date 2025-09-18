# ILCA-KNS Sailing Community Application - Complete Brownfield Architecture

## Introduction

This document provides comprehensive architectural guidance for the ILCA-KNS Sailing Community Application, covering both the **current state** of the existing system and the **enhanced multi-club architecture** required for the brownfield PRD. It serves as the definitive reference for AI agents working on enhancements and provides a complete blueprint for implementing the full sailing community platform vision.

### Document Scope

Complete architectural documentation covering:
- Current system state and implemented features
- Enhanced multi-club membership and role management requirements
- Technology constraints and optimization strategies
- Implementation roadmap and migration strategies

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Complete Architecture | 2025-01-10 | 3.0 | Combined current state + enhanced multi-club architecture | Winston (Architect) |
| Enhanced Architecture | 2025-01-10 | 2.0 | Added multi-club constraints analysis and Workers-optimized patterns | Winston (Architect) |
| Initial Architecture | 2025-01-10 | 1.0 | Brownfield analysis and base architecture | Winston (Architect) |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: [`src/worker.tsx`](src/worker.tsx:1) (Cloudflare Workers entry point)
- **Configuration**: [`wrangler.jsonc`](wrangler.jsonc:1), [`.env.example`](.env.example:1)
- **Database Schema**: [`prisma/schema.prisma`](prisma/schema.prisma:1)
- **Core Routing**: [`src/app/pages/user/routes.tsx`](src/app/pages/user/routes.tsx:1), [`src/app/pages/superuser/routes.tsx`](src/app/pages/superuser/routes.tsx:1)
- **Main Layout**: [`src/app/layouts/HomeLayout.tsx`](src/app/layouts/HomeLayout.tsx:1)
- **Session Management**: [`src/session/store.ts`](src/session/store.ts:1), [`src/session/durableObject.ts`](src/session/durableObject.ts:1)

### Enhancement Impact Areas

Based on the enhanced PRD requirements, these areas need development:

- **Multi-Club Management**: Extend existing Organization system for sailing-specific clubs
- **Community Blog/News**: Replace static mock data in [`src/app/components/PostList.tsx`](src/app/components/PostList.tsx:1) with dynamic content
- **Training Logs & Sailing Diary**: Implement UI for existing database schema + club context
- **Calendar & Events**: Build full event management system with club/group associations
- **Coach Dashboard**: Role-based interfaces for multi-group management
- **Admin Dashboard**: Enhance existing [`src/app/pages/superuser/Dashboard.tsx`](src/app/pages/superuser/Dashboard.tsx:1) with content moderation

## High Level Architecture

### Technical Summary

A modern React-based sailing community platform built with RedwoodSDK on Cloudflare Workers. The system implements server-side rendering with React Server Components, uses Prisma ORM with D1 database, and follows a mobile-first design approach. Enhanced for multi-club memberships, overlapping user roles, and complex permission management.

### Actual Tech Stack

| Category           | Technology          | Version | Notes                                    |
| ------------------ | ------------------- | ------- | ---------------------------------------- |
| Runtime            | Cloudflare Workers  | Latest  | Edge compute environment                 |
| Framework          | RedwoodSDK          | 0.0.85  | React framework for Cloudflare          |
| Frontend           | React               | 19.0.0  | Latest React with Server Components     |
| Database           | Cloudflare D1       | Latest  | SQLite-based edge database              |
| ORM                | Prisma              | 6.8.2   | Database toolkit and ORM                |
| Storage            | Cloudflare R2       | Latest  | Object storage for media files          |
| UI Components      | Shadcn/ui           | 0.0.4   | Pre-built component library             |
| Styling            | Tailwind CSS        | 4.1.7   | Utility-first CSS framework            |
| Build Tool         | Vite                | 6.2.6   | Development and build tool              |
| Package Manager    | pnpm                | 9.15.3  | Fast, disk space efficient package mgr |
| Authentication     | WebAuthn + Password | Custom  | Dual authentication methods            |
| Email Service      | Resend              | 4.5.1   | Transactional email API                |

## Source Tree and Module Organization

### Complete Project Structure

```text
ilcakns/
├── src/
│   ├── app/
│   │   ├── components/           # React components
│   │   │   ├── ui/              # Shadcn UI components
│   │   │   ├── PostCard.tsx     # Blog post display (to enhance with club context)
│   │   │   ├── PostList.tsx     # Post feed (to replace static data)
│   │   │   ├── UserProfileSidebar.tsx # Profile widget (to enhance with multi-club)
│   │   │   ├── ProfileEditForm.tsx    # Profile editing (to add club settings)
│   │   │   ├── ClubContextSwitcher.tsx    # NEW: Club/role switching
│   │   │   ├── MultiClubDashboard.tsx     # NEW: Multi-club overview
│   │   │   └── PermissionWrapper.tsx      # NEW: Permission-based rendering
│   │   ├── layouts/
│   │   │   ├── HomeLayout.tsx   # Main layout (to enhance with club context)
│   │   │   ├── AuthLayout.tsx   # Authentication pages layout
│   │   │   └── components/      # Layout-specific components
│   │   ├── pages/               # Route components
│   │   │   ├── Home.tsx         # Main community feed (to enhance with club filtering)
│   │   │   ├── FrontPage.tsx    # Landing page for unauthenticated users
│   │   │   ├── user/            # User management routes
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Signup.tsx
│   │   │   │   ├── profile/     # Profile management (to enhance with multi-club)
│   │   │   │   └── settings/    # User settings (to add club preferences)
│   │   │   ├── clubs/           # NEW: Club-specific routes
│   │   │   │   ├── [clubId]/
│   │   │   │   │   ├── dashboard.tsx    # Club dashboard
│   │   │   │   │   ├── events.tsx       # Club events
│   │   │   │   │   ├── training.tsx     # Training groups
│   │   │   │   │   └── members.tsx      # Member management
│   │   │   │   └── routes.tsx           # Club routing logic
│   │   │   ├── training/        # NEW: Training log interfaces
│   │   │   │   ├── logs.tsx            # Training log list
│   │   │   │   ├── create.tsx          # Create training log
│   │   │   │   └── [logId].tsx         # Training log details
│   │   │   ├── calendar/        # NEW: Event calendar system
│   │   │   │   ├── index.tsx           # Calendar main view
│   │   │   │   ├── event/
│   │   │   │   │   ├── [eventId].tsx   # Event details
│   │   │   │   │   └── create.tsx      # Create event
│   │   │   │   └── routes.tsx          # Calendar routing
│   │   │   ├── coach/           # NEW: Coach-specific interfaces
│   │   │   │   ├── dashboard.tsx       # Coach dashboard
│   │   │   │   ├── groups.tsx          # Training group management
│   │   │   │   └── students.tsx        # Student progress tracking
│   │   │   ├── superuser/       # Admin functionality (to enhance)
│   │   │   │   ├── Dashboard.tsx       # Basic admin dashboard
│   │   │   │   ├── content-moderation.tsx  # NEW: Content moderation
│   │   │   │   └── club-management.tsx     # NEW: Club administration
│   │   │   └── posts/           # NEW: Content creation interfaces
│   │   │       ├── create.tsx          # Rich text post creation
│   │   │       └── [postId]/edit.tsx   # Post editing
│   │   ├── auth/                # Authentication utilities
│   │   ├── shared/              # Shared utilities and constants
│   │   └── hooks/               # React hooks (to add club/permission hooks)
│   ├── session/                 # Session management (to enhance with club context)
│   ├── scripts/                 # Database seeding and utilities
│   └── worker.tsx               # Cloudflare Workers entry point
├── prisma/
│   └── schema.prisma            # Database schema (to enhance with multi-club models)
├── migrations/                  # Database migration files
├── memory-bank/                 # Project documentation and patterns
├── tasks/                       # Task management files
├── public/                      # Static assets
└── types/                       # TypeScript type definitions
```

### Key Modules and Their Purpose

**Current System**:
- **Authentication System**: [`src/app/pages/user/`](src/app/pages/user/) - Dual auth with WebAuthn and email/password
- **Profile Management**: [`src/app/pages/user/profile/`](src/app/pages/user/profile/) - Comprehensive sailing profile system
- **Session Management**: [`src/session/`](src/session/) - Durable Objects-based session storage
- **Community Feed**: [`src/app/components/PostList.tsx`](src/app/components/PostList.tsx:1) - Static mock posts, needs database integration
- **Admin Dashboard**: [`src/app/pages/superuser/`](src/app/pages/superuser/) - Basic user management interface
- **Layout System**: [`src/app/layouts/`](src/app/layouts/) - Responsive layout components

**New Multi-Club Modules**:
- **Club Management**: `src/app/pages/clubs/` - Club-specific dashboards and management
- **Training System**: `src/app/pages/training/` - Training log interfaces with club context
- **Event Calendar**: `src/app/pages/calendar/` - Event management with club/group associations
- **Coach Interfaces**: `src/app/pages/coach/` - Multi-group coaching tools
- **Content Creation**: `src/app/pages/posts/` - Rich text post creation and editing

## Technology Constraint Analysis: Cloudflare Workers & Multi-Club Architecture

### Cloudflare Workers Runtime Limitations

**Memory Limits**: 128MB per request impacts:
- Complex permission calculations across multiple clubs/groups
- Role context caching strategies
- Large permission matrices for multi-role users

**CPU Time Limits**: 50ms CPU time limit affects:
- Permission hierarchy resolution across multiple clubs
- Complex role aggregation queries
- Real-time permission checking for context switching

**Promise Resolution Requirements**: Critical constraint requiring strict Promise patterns:

```typescript
// ❌ Problematic for complex role checking
async function checkMultiClubPermissions(userId: string, clubs: Club[]) {
  const permissions = clubs.map(async club => {
    return await getClubPermissions(userId, club.id); // Multiple hanging Promises risk
  });
  return Promise.all(permissions);
}

// ✅ Optimized for Workers constraints
async function checkMultiClubPermissions(userId: string, clubs: Club[]) {
  // Single batch query to minimize Promise chains
  return await db.clubMembership.findMany({
    where: { userId, clubId: { in: clubs.map(c => c.id) } },
    include: { club: true, role: true }
  });
}
```

### Performance Optimization Strategies

**Permission Caching Pattern**:
```typescript
// Edge-compatible permission caching with memory limits
class PermissionCache {
  private cache = new Map<string, UserClubContext>();
  private maxSize = 100; // Stay within memory limits
  
  async getOrSet(userId: string, fetcher: () => Promise<UserClubContext>): Promise<UserClubContext> {
    const cached = this.cache.get(userId);
    if (cached) return cached;
    
    if (this.cache.size >= this.maxSize) {
      // LRU eviction to prevent memory overflow
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const context = await fetcher();
    this.cache.set(userId, context);
    return context;
  }
}
```

## Enhanced Data Models and Schema Evolution

### Current Foundation Analysis

The existing schema provides a solid foundation for multi-club enhancement:

**Existing Organization/OrganizationMembership Pattern**:
- [`Organization`](prisma/schema.prisma:55) model supports multi-tenant structure
- [`OrganizationMembership`](prisma/schema.prisma:65) with role field supports role-based access
- Unique constraint on `[userId, organizationId]` prevents duplicate memberships
- String-based roles (`"ADMIN", "COACH", "MEMBER"`) provide flexibility

**Current User/Profile System**:
- [`User`](prisma/schema.prisma:24) model with basic role enum (`USER`/`SUPERUSER`)
- [`Profile`](prisma/schema.prisma:77) with sailing-specific fields and `clubAffiliation`
- Existing relationship patterns proven to work with Cloudflare Workers

### Enhanced Schema for Multi-Club Support

Building on existing foundation with additive-only changes:

```prisma
// Enhanced Club model (replaces/extends Organization for sailing context)
model Club {
  id          String   @id @default(uuid())
  name        String
  description String?
  location    String?
  type        ClubType @default(SAILING_CLUB)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relationships
  memberships     ClubMembership[]
  trainingGroups  TrainingGroup[]
  events          Event[]
  posts           Post[]
  trainingLogs    TrainingLog[]
  
  // Legacy compatibility
  organizationId  String? // Link to existing Organization if needed
  organization    Organization? @relation(fields: [organizationId], references: [id])
  
  @@index([type])
  @@index([isActive])
}

enum ClubType {
  SAILING_CLUB
  YACHT_CLUB
  TRAINING_CENTER
  RACING_TEAM
}

// Enhanced membership with denormalized permissions for Workers optimization
model ClubMembership {
  id               String   @id @default(uuid())
  userId           String
  clubId           String
  roleType         ClubRole
  // Denormalized permissions JSON for fast Workers-compatible lookup
  permissionsJson  String   @default("[]") // JSON array of permission strings
  isActive         Boolean  @default(true)
  joinedAt         DateTime @default(now())
  
  // Relationships
  user             User     @relation(fields: [userId], references: [id])
  club             Club     @relation(fields: [clubId], references: [id])
  groupMemberships GroupMembership[]
  
  @@unique([userId, clubId])
  @@index([userId])
  @@index([clubId])
  @@index([roleType])
}

enum ClubRole {
  MEMBER
  COACH
  ADMIN
  OWNER
}

// Training groups within clubs
model TrainingGroup {
  id           String   @id @default(uuid())
  clubId       String
  name         String
  description  String?
  skillLevel   SkillLevel
  isActive     Boolean  @default(true)
  maxMembers   Int?
  createdAt    DateTime @default(now())
  
  // Relationships
  club         Club     @relation(fields: [clubId], references: [id])
  memberships  GroupMembership[]
  events       Event[]
  trainingLogs TrainingLog[]
  
  @@index([clubId])
  @@index([skillLevel])
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  RACING
}

// Group membership within training groups
model GroupMembership {
  id               String   @id @default(uuid())
  clubMembershipId String
  trainingGroupId  String
  role             GroupRole @default(PARTICIPANT)
  joinedAt         DateTime @default(now())
  isActive         Boolean  @default(true)
  
  // Relationships
  clubMembership   ClubMembership @relation(fields: [clubMembershipId], references: [id])
  trainingGroup    TrainingGroup  @relation(fields: [trainingGroupId], references: [id])
  
  @@unique([clubMembershipId, trainingGroupId])
  @@index([clubMembershipId])
  @@index([trainingGroupId])
}

enum GroupRole {
  PARTICIPANT
  ASSISTANT_COACH
  HEAD_COACH
}

// Enhanced Event model with club/group context
model Event {
  id              String     @id @default(uuid())
  clubId          String
  trainingGroupId String?
  title           String
  description     String?
  eventType       EventType
  startDate       DateTime
  endDate         DateTime?
  location        String?
  maxParticipants Int?
  isPublic        Boolean    @default(false)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relationships
  club            Club           @relation(fields: [clubId], references: [id])
  trainingGroup   TrainingGroup? @relation(fields: [trainingGroupId], references: [id])
  participants    EventParticipant[]
  
  @@index([clubId])
  @@index([trainingGroupId])
  @@index([eventType])
  @@index([startDate])
}

enum EventType {
  TRAINING_SESSION
  REGATTA
  SOCIAL_EVENT
  MEETING
  MAINTENANCE
}

model EventParticipant {
  id        String            @id @default(uuid())
  eventId   String
  userId    String
  status    ParticipantStatus @default(PENDING)
  createdAt DateTime          @default(now())
  
  // Relationships
  event     Event @relation(fields: [eventId], references: [id])
  user      User  @relation(fields: [userId], references: [id])
  
  @@unique([eventId, userId])
  @@index([eventId])
  @@index([userId])
}

enum ParticipantStatus {
  PENDING
  CONFIRMED
  DECLINED
  ATTENDED
  NO_SHOW
}

// Enhanced training log with club context
model TrainingLog {
  id          String   @id @default(uuid())
  userId      String
  clubId      String?
  groupId     String?
  title       String
  description String?
  duration    Int?     // Minutes
  conditions  String?  // JSON: weather, wind, etc.
  boatSetup   String?  // JSON: rig configuration
  skills      String?  // JSON: skills practiced
  notes       String?
  isPrivate   Boolean  @default(false)
  logDate     DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relationships
  user        User          @relation(fields: [userId], references: [id])
  club        Club?         @relation(fields: [clubId], references: [id])
  group       TrainingGroup? @relation(fields: [groupId], references: [id])
  
  @@index([userId])
  @@index([clubId])
  @@index([logDate])
}

// Enhanced Post model with club context
model Post {
  id          String     @id @default(uuid())
  userId      String
  clubId      String?    // NEW: Club context
  user        User       @relation(fields: [userId], references: [id])
  club        Club?      @relation(fields: [clubId], references: [id])
  title       String
  content     String
  category    String?
  status      PostStatus @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  comments    Comment[]
  
  @@index([clubId])
}

// Enhanced User model with multi-club relationships
model User {
  // ... existing fields remain unchanged
  
  // New relationships for multi-club support
  clubMemberships    ClubMembership[]
  eventParticipation EventParticipant[]
  trainingLogs       TrainingLog[]
  
  // Enhanced backward compatibility
  organizations OrganizationMembership[] // Keep existing
}

// Enhanced Profile with multi-club settings
model Profile {
  // ... existing fields remain unchanged
  
  // New multi-club fields
  primaryClubId     String? // Default club for context switching
  preferredGroups   String? // JSON array of preferred training group IDs
  privacySettings   String? // Enhanced JSON schema for club-specific privacy
}
```

### Schema Migration Strategy

**Phase 1: Foundation Migration**
1. Create new Club model alongside existing Organization
2. Add ClubMembership with basic role support
3. Maintain backward compatibility with existing Organization system

**Phase 2: Enhanced Features**
1. Add TrainingGroup and GroupMembership models
2. Enhance Event model with club/group context
3. Add TrainingLog with club associations

**Phase 3: Optimization**
1. Add denormalized permission fields for Workers performance
2. Implement permission caching strategies
3. Optimize queries for multi-club scenarios

## Component Architecture and UI Patterns

### Multi-Club UI Components

Building on existing [`HomeLayout`](src/app/layouts/HomeLayout.tsx:1) and component patterns:

#### Context Switching Components

```typescript
// Club context switcher in header
interface ClubContextSwitcher {
  currentClub: Club;
  availableClubs: Club[];
  onClubChange: (clubId: string) => void;
}

// Role indicator and switcher
interface RoleContextDisplay {
  currentRole: ClubRole;
  availableRoles: ClubRole[];
  clubContext: Club;
  onRoleChange: (role: ClubRole) => void;
}
```

#### Enhanced Navigation Components

```typescript
// Context-aware navigation extending existing patterns
interface ClubNavigationProps {
  user: User;
  clubContext: Club;
  userRole: ClubRole;
  permissions: Permission[];
}

// Multi-club dashboard layout
interface MultiClubDashboard {
  clubs: Club[];
  activeClub: Club;
  aggregatedStats: ClubStats[];
  recentActivity: Activity[];
}
```

### Integration with Existing Components

**PostCard/PostList Enhancement**:
- Extend existing [`PostCard`](src/app/components/PostCard.tsx:1) with club context display
- Enhance [`PostList`](src/app/components/PostList.tsx:1) with club filtering
- Maintain existing component interfaces while adding club-aware features

**Profile Component Integration**:
- Extend [`ProfileEditForm`](src/app/components/ProfileEditForm.tsx:1) with multi-club settings
- Enhance [`UserProfileSidebar`](src/app/components/UserProfileSidebar.tsx:1) with club membership display
- Add club-specific privacy controls

### Permission-Aware Component Patterns

```typescript
// Higher-order component for permission checking
function withClubPermission(permission: string, fallback?: React.ComponentType) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function PermissionWrappedComponent(props: P & { clubContext: Club }) {
      const hasPermission = useClubPermission(permission, props.clubContext.id);
      
      if (!hasPermission) {
        return fallback ? <fallback /> : null;
      }
      
      return <Component {...props} />;
    };
  };
}

// Permission hook leveraging Cloudflare Workers constraints
function useClubPermission(permission: string, clubId?: string): boolean {
  const { userContext } = useUserClubContext();
  
  // Optimized permission check using denormalized permissions
  return useMemo(() => {
    const targetClub = clubId || userContext.activeClubId;
    const membership = userContext.allMemberships.find(m => m.clubId === targetClub);
    
    if (!membership) return false;
    
    // Parse denormalized permissions JSON for fast lookup
    const permissions = JSON.parse(membership.permissionsJson);
    return permissions.includes(permission);
  }, [permission, clubId, userContext]);
}
```

## API Patterns and Integration Points

### Current API Patterns

The system follows RedwoodSDK patterns:

- **Server Components**: Data fetching at the component level
- **Server Functions**: Database operations marked with `"use server"`
- **Client Components**: Interactive UI marked with `"use client"`
- **Route Handlers**: HTTP request processing in route definitions

Example API pattern in [`src/app/pages/user/routes.tsx:75`](src/app/pages/user/routes.tsx:75):

```tsx
route("/:username/profile/edit", async (props) => {
  const username = props.params.username;
  const isOwnProfile = props.ctx.user?.username === username;
  
  const targetUser = await db.user.findUnique({
    where: { username },
    select: { id: true }
  });
  
  return <ProfileEditPage UserId={targetUser.id} isOwnProfile={isOwnProfile} {...props} />;
})
```

### Enhanced API Patterns for Multi-Club

**Club-Aware Route Patterns**:
```typescript
// Club-aware route patterns extending existing user routes
route("/clubs/:clubId/dashboard", [requireClubMembership, async (props) => {
  const { clubId } = props.params;
  const membership = await validateClubAccess(props.ctx.user.id, clubId);
  
  return <ClubDashboard clubId={clubId} membership={membership} {...props} />;
}]);

// Multi-club user routes
route("/user/:username/clubs", [isAuthenticated, async (props) => {
  const clubs = await getUserClubs(props.params.username);
  return <UserClubsPage clubs={clubs} {...props} />;
}]);
```

**Enhanced Server Functions**:
```typescript
"use server";

// Club context-aware server functions
export async function switchClubContext(clubId: string) {
  const { ctx } = requestInfo;
  const membership = await validateClubMembership(ctx.user.id, clubId);
  
  // Update session with new active club
  await updateSessionClubContext(ctx.session.id, clubId);
  
  return { success: true, activeClub: membership.club };
}

export async function createClubPost(clubId: string, formData: FormData) {
  const { ctx } = requestInfo;
  
  // Verify permissions for club posting
  const hasPermission = await checkClubPermission(ctx.user.id, clubId, 'CREATE_POST');
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
  
  // Create post with club context
  return await db.post.create({
    data: {
      title: formData.get('title'),
      content: formData.get('content'),
      userId: ctx.user.id,
      clubId: clubId
    }
  });
}
```

### Authentication and Session Enhancement

**Enhanced Session Context**:
```typescript
interface EnhancedSessionContext {
  userId: string;
  activeClubId?: string;
  activeMembership?: ClubMembership;
  aggregatedPermissions: string[];
  availableClubs: Club[];
}
```

**Middleware Enhancement**:
```typescript
// Enhanced authentication middleware
async function enhancedAuthMiddleware({ ctx, request, headers }) {
  // Existing user loading pattern maintained
  if (ctx.session?.userId) {
    ctx.user = await db.user.findUnique({
      where: { id: ctx.session.userId },
      include: {
        clubMemberships: {
          where: { isActive: true },
          include: { club: true }
        }
      }
    });
    
    // Add multi-club context
    if (ctx.user?.clubMemberships.length > 0) {
      ctx.clubContext = resolveActiveClubContext(ctx.user, request);
    }
  }
}
```

## Current Implementation Status & Technical Debt

### ✅ Fully Implemented

- User registration and authentication (dual methods)
- User profile management with sailing-specific fields
- Password reset functionality  
- Basic admin dashboard for superusers
- Responsive layout system
- Session management with Durable Objects
- Database schema foundation (Organization/OrganizationMembership)

### 🔄 Partially Implemented

- Community blog/news system (UI exists, uses static data in [`PostList.tsx`](src/app/components/PostList.tsx:20))
- Navigation structure (complete but links to unimplemented features)
- Organization management (database schema exists, basic UI)

### ❌ Not Implemented (Priority Order)

**High Priority (Core Platform Features)**:
1. **Multi-Club Database Integration**: Extend Organization system for sailing clubs
2. **Dynamic Post Management**: Replace static data with real database queries
3. **Rich Text Editor**: Implement WYSIWYG editor for content creation
4. **Event Calendar**: Build calendar interface with CRUD operations
5. **Media Upload System**: Integrate R2 storage with upload interface

**Medium Priority (User Experience)**:
1. **Training Log Interface**: Build UI for sailing diary and training tracking
2. **Coach Dashboard**: Specialized interface for multi-group management
3. **Club Context Switching**: UI components for role/club switching
4. **Permission-Based UI**: Implement permission-aware component patterns

**Low Priority (Administrative)**:
1. **Content Moderation**: Admin tools for reviewing and managing content
2. **Advanced Profile Features**: Boat setup wizards, certification management
3. **Analytics Dashboard**: Usage statistics and user engagement metrics
4. **API Documentation**: OpenAPI specification for potential integrations

### Critical Technical Debt

1. **Community Posts System**: Static mock data needs database integration
2. **Calendar/Events System**: Database schema exists but no implementation
3. **Training Logs**: Profile schema supports data but no dedicated UI
4. **Media Upload**: R2 storage configured but no upload interface
5. **Email Configuration**: Development mode setup needs production configuration

## Integration Points and External Dependencies

### External Services

| Service           | Purpose              | Integration Type | Key Files                                    |
| ----------------- | -------------------- | ---------------- | -------------------------------------------- |
| Cloudflare D1     | Primary Database     | Native           | [`wrangler.jsonc:31`](wrangler.jsonc:31)    |
| Cloudflare R2     | Media Storage        | Native           | [`wrangler.jsonc:38`](wrangler.jsonc:38)    |
| Resend API        | Email Delivery       | REST API         | [`src/app/auth/email.ts`](src/app/auth/email.ts) |
| WebAuthn          | Passkey Auth         | Browser API      | [`@simplewebauthn`](package.json:45)        |

### Internal Integration Points

- **Authentication Flow**: Middleware in [`worker.tsx:55`](src/worker.tsx:55) loads user session for all requests
- **Role-Based Access**: [`isAuthenticated`](src/app/pages/user/routes.tsx:18) and [`isSuperUser`](src/app/pages/superuser/routes.tsx:6) middleware
- **Profile Auto-Creation**: Automatic profile creation system in [`src/app/pages/user/profile/functions.ts`](src/app/pages/user/profile/functions.ts)

## Development and Deployment

### Local Development Setup

1. **Install Dependencies**: `pnpm install`
2. **Environment Setup**: Copy `.env.example` to `.env` and configure
3. **Database Setup**: 
   - Local: `pnpm migrate:dev` 
   - Remote: `pnpm migrate:prd`
4. **Start Development**: `pnpm dev`
5. **Known Issues**: Server restart required after schema changes

### Build and Deployment Process

- **Build Command**: `pnpm build` (Vite-based build)
- **Deployment**: `pnpm release` (automated Cloudflare Workers deployment)
- **Environments**: Development (local), Production (Cloudflare)
- **Database Management**: Separate local/remote D1 instances

### Testing Strategy

**Implemented Testing Infrastructure**:
- **Unit Tests**: Vitest with React Testing Library for component testing
- **Coverage**: >80% coverage target for tested components using @vitest/coverage-v8
- **Test Environment**: jsdom environment for React component testing
- **Mocking**: Comprehensive mocking for Cloudflare Workers, D1 database, and external services

**Current Test Coverage**:
- **Login Flow**: 11 comprehensive tests covering authentication, error handling, and security
- **Profile Management**: 19 tests covering form validation, XSS prevention, and API integration
- **Navigation**: 13 tests covering layout rendering, role-based navigation, and accessibility
- **Integration Tests**: 4 tests covering multi-component workflows and critical user journeys
- **Server Function Tests**: 17 tests covering authentication and profile CRUD server functions

**Testing Guidelines**:

1. **Component Testing Patterns**:
   ```typescript
   // Mock external dependencies
   vi.mock('@/app/pages/user/profile/functions', () => ({
     updateUserProfile: vi.fn(),
     getUserProfile: vi.fn()
   }));

   // Test user interactions
   const user = userEvent.setup();
   await user.type(screen.getByLabelText('Email'), 'test@example.com');
   await user.click(screen.getByRole('button', { name: 'Submit' }));
   ```

2. **Cloudflare Workers Mocking**:
   ```typescript
   // Mock Workers environment in test setup
   vi.mock('rwsdk/worker', () => ({
     requestInfo: { ctx: { user: mockUser } }
   }));

   // Mock D1 database operations
   vi.mock('@/db', () => ({
     db: { user: { findUnique: vi.fn() } }
   }));
   ```

3. **Integration Testing Patterns**:
   ```typescript
   // Test multi-component workflows
   describe('Integration Tests: Critical User Journeys', () => {
     it('should login and navigate to profile with data loading', async () => {
       // Mock authentication success
       mockLoginWithPassword.mockResolvedValue(true);
       mockGetPublicProfile.mockResolvedValue(mockProfileData);

       // Test login flow
       render(<Login />);
       await user.type(screen.getByLabelText(/email/i), 'test@example.com');
       await user.click(screen.getByRole('button', { name: /login/i }));

       // Verify navigation and profile loading
       expect(mockLocation.href).toBe('/home');
       render(<ProfileView profileUserId="user-123" />);
       expect(screen.getByText('ILCA 6')).toBeInTheDocument();
     });
   });
   ```

4. **Server Function Testing Patterns**:
   ```typescript
   // Mock server functions directly for isolated testing
   const mockLoginWithPassword = vi.fn();
   const mockGetUserProfile = vi.fn();

   vi.mock('../functions', () => ({
     loginWithPassword: mockLoginWithPassword,
   }));

   // Test function behavior with mocked return values
   it('should return user ID on successful login', async () => {
     mockLoginWithPassword.mockResolvedValue('user-123');
     const result = await mockLoginWithPassword('test@example.com', 'password');
     expect(result).toBe('user-123');
   });
   ```

5. **Security Testing**:
   - XSS prevention testing with malicious input strings
   - Form validation testing with edge cases
   - Authentication flow testing with invalid credentials

6. **Accessibility Testing**:
   - Semantic HTML structure validation
   - ARIA label and role testing
   - Keyboard navigation testing

**Test Commands**:
```bash
pnpm test                     # Run tests in watch mode
pnpm test:coverage           # Run tests with coverage report
pnpm test:ui                 # Run tests with UI interface
pnpm test [file-pattern]     # Run specific test files
```

**Testing Best Practices**:
- **Mock Strategy**: Mock external dependencies (database, APIs) but test actual function logic
- **Error Handling**: Test both success and failure scenarios comprehensively
- **Edge Cases**: Include tests for empty inputs, invalid data, and network failures
- **Coverage Target**: Maintain >85% coverage for critical components and functions
- **Test Isolation**: Each test should be independent and not rely on other test state

**Future Testing Enhancements**:
- **E2E Tests**: Full user journey testing with Playwright
- **Performance Tests**: Component rendering performance benchmarks
- **Visual Regression Tests**: UI consistency testing
- **API Contract Tests**: Verify server function contracts remain stable

## Architecture Patterns and Conventions

### RedwoodSDK Patterns

The application follows specific patterns documented in [`memory-bank/redwoodSDKPatterns.md`](memory-bank/redwoodSDKPatterns.md):

- **Server-First Approach**: Data fetching in server components
- **Client Component Boundaries**: Clear separation for interactivity
- **Promise Handling**: Strict rules to prevent hanging promises in Cloudflare Workers
- **Two-Pass Rendering**: For hydration error prevention

### Key Architectural Decisions

1. **Dual Authentication**: WebAuthn (preferred) + Email/Password (fallback)
2. **Profile Auto-Creation**: Seamless user onboarding with automatic profile setup
3. **Multi-Club Role System**: Extension of existing USER/SUPERUSER model with club-specific roles
4. **Mobile-First Design**: Responsive layouts prioritizing mobile experience
5. **Denormalized Permissions**: JSON-based permission storage for Workers optimization
6. **Additive Schema Evolution**: Backward-compatible database enhancements

## Implementation Roadmap

### Phase 1: Foundation Enhancement (Low Risk)
**Timeline**: 2-3 weeks
**Focus**: Core system upgrades without breaking changes

1. **Database Schema Migration**:
   - Add Club, ClubMembership models alongside existing Organization
   - Implement backward compatibility layers
   - Add indexes for performance optimization

2. **Dynamic Post System**:
   - Replace static mock data in PostList with database queries
   - Maintain existing component interfaces
   - Add basic club context to posts

3. **Basic Permission System**:
   - Implement denormalized permission storage
   - Add permission checking utilities
   - Create permission-aware component wrappers

### Phase 2: Multi-Club Core (Medium Risk)
**Timeline**: 4-5 weeks
**Focus**: Multi-club functionality and role management

1. **Club Management Interface**:
   - Build club dashboard components
   - Implement club membership management
   - Add club context switching UI

2. **Enhanced Authentication**:
   - Extend session management with club context
   - Update middleware for multi-club support
   - Implement role-based route protection

3. **Training and Event Systems**:
   - Build training log interfaces with club context
   - Implement event calendar with club/group associations
   - Add RSVP and participation tracking

### Phase 3: Advanced Features (High Risk)
**Timeline**: 6-8 weeks
**Focus**: Complex multi-role scenarios and optimization

1. **Coach Dashboard**:
   - Multi-group management interfaces
   - Student progress tracking across clubs
   - Training plan management

2. **Content Management**:
   - Rich text editor for post creation
   - Media upload and management system
   - Content moderation tools for admins

3. **Performance Optimization**:
   - Implement advanced caching strategies
   - Optimize permission checking for complex scenarios
   - Add monitoring and analytics

### Risk Mitigation Strategies

**High-Risk Scenarios**:
1. **Complex Permission Queries**: Multiple club memberships with nested group permissions
   - **Mitigation**: Denormalized permission storage, single-query resolution patterns

2. **Context Switching Performance**: Frequent club/role switching causing UI lag
   - **Mitigation**: Optimistic UI updates, background context preloading

3. **Database Migration Complexity**: Large existing user base with profile data
   - **Mitigation**: Additive-only migrations, backward compatibility preservation

## Appendix - Development Resources

### Frequently Used Commands

```bash
pnpm dev                    # Start development server
pnpm build                  # Production build
pnpm release                # Deploy to Cloudflare Workers
pnpm migrate:dev            # Apply migrations locally
pnpm migrate:prd            # Apply migrations to production
pnpm migrate:new "name"     # Create new migration
pnpm generate               # Regenerate Prisma client
pnpm types                  # TypeScript type checking
pnpm seed                   # Run database seed script
```

### Key Documentation Files

- **Technical Patterns**: [`memory-bank/redwoodSDKPatterns.md`](memory-bank/redwoodSDKPatterns.md)
- **System Patterns**: [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md)  
- **Progress Tracking**: [`memory-bank/progress.md`](memory-bank/progress.md)
- **Project Brief**: [`memory-bank/projectbrief.md`](memory-bank/projectbrief.md)
- **Enhanced PRD**: [`docs/prd.md`](docs/prd.md)

### Debugging and Troubleshooting

- **Logs**: Check Cloudflare Workers logs in dashboard
- **Local Database**: SQLite file in `.wrangler/state/`
- **Hot Reload Issues**: Restart server after schema changes
- **Promise Errors**: Check [`memory-bank/techContext.md`](memory-bank/techContext.md) for patterns
- **Permission Issues**: Verify club membership and role assignments in database

---

*This complete architecture document provides the definitive blueprint for implementing the full ILCA-KNS sailing community platform with enhanced multi-club support while maintaining compatibility with existing systems and respecting Cloudflare Workers constraints.*