# ILCA-KNS Enhanced Brownfield Architecture Document

## Introduction

This document outlines the architectural approach for enhancing **ILCA-KNS Sailing Community Application** with **multi-club membership support, overlapping user roles, and complex permission management for sailing communities**. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development of new features while ensuring seamless integration with the existing RedwoodSDK on Cloudflare Workers system.

**Relationship to Existing Architecture:**
This document supplements the existing brownfield architecture by defining how the enhanced multi-club features will integrate with current Organization/User/Profile systems. The enhancement builds on the existing foundation while adding sophisticated club membership, role management, and context-switching capabilities that address real-world sailing community scenarios where users have multiple club affiliations and overlapping roles.

## Technology Constraint Analysis: Cloudflare Workers & Complex Role Management

### Cloudflare Workers Runtime Limitations

Based on the existing system analysis and documented patterns, the following constraints must be considered for multi-club architecture:

#### Memory and Performance Constraints

**Memory Limits**: Cloudflare Workers have a 128MB memory limit per request, which impacts:
- Complex permission calculations across multiple clubs/groups
- Role context caching strategies
- Large permission matrices for multi-role users

**CPU Time Limits**: 50ms CPU time limit (with potential for 30-second extension) affects:
- Permission hierarchy resolution across multiple clubs
- Complex role aggregation queries
- Real-time permission checking for context switching

#### Promise Resolution Requirements

**Critical Constraint**: Cloudflare Workers requires strict Promise resolution patterns that directly impact multi-club architecture:

```typescript
// ❌ Problematic for complex role checking
async function checkMultiClubPermissions(userId: string, clubs: Club[]) {
  const permissions = clubs.map(async club => {
    // Each async operation creates a Promise that must resolve
    return await getClubPermissions(userId, club.id);
  });
  // Multiple hanging Promises risk in complex scenarios
  return Promise.all(permissions);
}

// ✅ Optimized for Workers constraints
async function checkMultiClubPermissions(userId: string, clubs: Club[]) {
  // Batch query to minimize Promise chains
  return await db.clubMembership.findMany({
    where: { userId, clubId: { in: clubs.map(c => c.id) } },
    include: { club: true, role: true }
  });
}
```

#### Database Connection Limits

**D1 Database Constraints**:
- Maximum 1000 statements per transaction
- Connection pooling limitations affect concurrent role checks
- Query complexity limits for permission hierarchy resolution

### Multi-Club Architecture Adaptations

#### Permission Checking Strategy

**Constraint-Aware Permission Model**:
```typescript
// Single-query permission resolution
interface UserClubContext {
  userId: string;
  activeClubId: string;
  allMemberships: ClubMembership[];
  aggregatedPermissions: Permission[];
}

// Optimized for Workers memory/CPU limits
async function resolveUserContext(userId: string, requestedClubId?: string): Promise<UserClubContext> {
  // Single database query to get all user permissions
  const memberships = await db.clubMembership.findMany({
    where: { userId },
    include: {
      club: true,
      role: { include: { permissions: true } }
    }
  });

  // In-memory permission aggregation (within memory limits)
  const aggregatedPermissions = memberships.flatMap(m => m.role.permissions);
  
  return {
    userId,
    activeClubId: requestedClubId || memberships[0]?.clubId,
    allMemberships: memberships,
    aggregatedPermissions
  };
}
```

#### Context Switching Optimization

**Edge-Optimized Context Management**:
```typescript
// Minimize session state for Workers constraints
interface SessionContext {
  userId: string;
  activeClubId: string;
  roleSnapshot: {
    clubId: string;
    roleType: 'sailor' | 'coach' | 'admin';
    permissions: string[];
  }[];
}

// Cached permission checking to avoid repeated DB queries
function hasPermission(context: SessionContext, permission: string, clubId?: string): boolean {
  const targetClub = clubId || context.activeClubId;
  return context.roleSnapshot
    .filter(role => role.clubId === targetClub)
    .some(role => role.permissions.includes(permission));
}
```

#### Database Schema Optimization for Workers

**Denormalized Permission Storage**:
```prisma
model ClubMembership {
  id               String   @id @default(cuid())
  userId           String
  clubId           String
  roleType         RoleType
  // Denormalized permissions array for fast lookup
  permissionsJson  String   // JSON array of permission strings
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  
  user             User     @relation(fields: [userId], references: [id])
  club             Club     @relation(fields: [clubId], references: [id])
  
  @@unique([userId, clubId])
  @@index([userId])
  @@index([clubId])
}
```

### Performance Mitigation Strategies

#### 1. Permission Caching Pattern

```typescript
// Edge-compatible permission caching
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

#### 2. Batch Operation Patterns

```typescript
// Optimize for D1 transaction limits
async function batchUpdateMemberships(updates: MembershipUpdate[]): Promise<void> {
  // Chunk operations to stay under 1000 statement limit
  const chunks = chunkArray(updates, 500);
  
  for (const chunk of chunks) {
    await db.$transaction(
      chunk.map(update => 
        db.clubMembership.update({
          where: { id: update.id },
          data: update.data
        })
      )
    );
  }
}
```

#### 3. Streaming Permission Checks

```typescript
// Stream permission results for large club lists
async function* streamClubPermissions(userId: string, clubIds: string[]) {
  const batchSize = 10;
  
  for (let i = 0; i < clubIds.length; i += batchSize) {
    const batch = clubIds.slice(i, i + batchSize);
    const permissions = await db.clubMembership.findMany({
      where: { userId, clubId: { in: batch } }
    });
    yield permissions;
  }
}
```

### Risk Assessment & Mitigation

#### High-Risk Scenarios

1. **Complex Permission Hierarchies**: Risk of CPU timeout during role resolution
   - **Mitigation**: Pre-computed permission matrices, denormalized storage
   
2. **Multi-Club Context Switching**: Risk of memory overflow with large club memberships
   - **Mitigation**: Lazy loading, context-specific permission subsets
   
3. **Concurrent Role Updates**: Risk of transaction conflicts across clubs
   - **Mitigation**: Optimistic locking, retry mechanisms

#### Workers-Specific Considerations

1. **Cold Start Impact**: First request latency affects multi-club users
   - **Mitigation**: Warm-up strategies, essential permission pre-loading
   
2. **Cross-Request State**: Cannot maintain state between requests
   - **Mitigation**: Stateless permission checking, session-based context

3. **External Service Calls**: Each external call adds latency and failure points
   - **Mitigation**: Minimize external dependencies, local permission validation

### Implementation Recommendations

#### Phase 1: Foundation (Low Risk)
- Single-club enhanced permissions
- Basic role switching UI
- Optimized permission checking

#### Phase 2: Multi-Club Core (Medium Risk)
- Club membership management
- Context switching backend
- Permission aggregation

#### Phase 3: Advanced Features (High Risk)
- Complex role hierarchies
- Cross-club content sharing
- Advanced analytics

This constraint analysis ensures the multi-club architecture respects Cloudflare Workers limitations while delivering the enhanced functionality required by the PRD. The recommendations prioritize performance, reliability, and scalability within the edge computing environment.

## Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Enhanced Architecture | 2025-01-10 | 2.0 | Added multi-club constraints analysis and Workers-optimized patterns | Winston (Architect) |
| Initial Architecture | 2025-01-10 | 1.0 | Brownfield analysis and base architecture | Winston (Architect) |
## Enhanced Data Models and Schema Changes

### Current Foundation Analysis

The existing schema provides a solid foundation for multi-club enhancement:

**Existing Organization/OrganizationMembership Pattern**:
- [`Organization`](prisma/schema.prisma:55) model already supports multi-tenant structure
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
  
  // Legacy compatibility
  organizationId  String? // Link to existing Organization if needed
  organization    Organization? @relation(fields: [organizationId], references: [id])
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

### Integration with Existing User Model

**Additive User Model Changes**:
```prisma
model User {
  // ... existing fields remain unchanged
  
  // New relationships for multi-club support
  clubMemberships  ClubMembership[]
  eventParticipation EventParticipant[]
  trainingLogs     TrainingLog[]
  
  // Enhanced backward compatibility
  organizations OrganizationMembership[] // Keep existing
}
```

**Enhanced Profile Integration**:
```prisma
model Profile {
  // ... existing fields remain unchanged
  
  // Enhanced sailing-specific fields
  sailingExperience String? // Keep existing
  certifications    String? // Keep existing, enhance with JSON schema
  boatInformation   String? // Keep existing, enhance with structured JSON
  
  // New multi-club fields
  primaryClubId     String? // Default club for context switching
  preferredGroups   String? // JSON array of preferred training group IDs
  privacySettings   String? // Enhanced JSON schema for club-specific privacy
}
```

## Component Architecture

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

## Validation Against Existing System Constraints

### Database Compatibility Check

**✅ Compatible Patterns**:
- Existing Organization/OrganizationMembership provides proven multi-tenant foundation
- UUID-based IDs consistent across all models
- DateTime fields follow existing patterns
- Relationship patterns proven to work with Prisma + D1

**✅ Cloudflare Workers Validation**:
- Denormalized permissions reduce complex JOIN queries
- Indexed fields optimize common lookup patterns
- JSON fields minimize schema changes while adding flexibility
- Batch operation patterns respect D1 transaction limits

**✅ RedwoodSDK Integration**:
- Schema follows existing server component data fetching patterns
- Permission hooks compatible with client component boundaries
- Context switching aligns with existing session management

### Performance Impact Assessment

**Memory Usage**: Multi-club context increases session size by ~2-4KB per user
- **Mitigation**: Lazy loading of club contexts, essential permissions only in session

**Query Complexity**: Permission checking across multiple clubs increases database load
- **Mitigation**: Denormalized permissions, optimized indexes, query batching

**CPU Time**: Role resolution and permission calculation adds processing overhead
- **Mitigation**: In-memory permission caching, pre-computed permission matrices

### Risk Mitigation Strategies

**High-Risk Scenarios**:
1. **Complex Permission Queries**: Multiple club memberships with nested group permissions
   - **Mitigation**: Denormalized permission storage, single-query resolution patterns

2. **Context Switching Performance**: Frequent club/role switching causing UI lag
   - **Mitigation**: Optimistic UI updates, background context preloading

3. **Database Migration Complexity**: Large existing user base with profile data
   - **Mitigation**: Additive-only migrations, backward compatibility preservation

**Medium-Risk Scenarios**:
1. **Session Storage Overflow**: Large club memberships exceeding Durable Object limits
   - **Mitigation**: Selective session data, lazy loading patterns

2. **UI State Management**: Complex role/club state across components
   - **Mitigation**: Centralized context management, clear state boundaries

## Integration Points and External Dependencies

### Authentication Integration

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

### API Integration Patterns

**Enhanced Route Patterns**:
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

**Server Function Enhancements**:
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

This validation confirms that the enhanced multi-club architecture can be successfully integrated with the existing ILCA-KNS system while respecting Cloudflare Workers constraints and maintaining performance within acceptable limits.
