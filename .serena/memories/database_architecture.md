# ILCA-KNS Database Architecture

## Overview

**Database Platform**: Cloudflare D1 SQLite with Prisma ORM
**Architecture**: Edge-distributed SQLite with eventual consistency
**Schema Management**: Prisma migrations and introspection
**Connection**: Edge-optimized connection pooling

## Core Schema Design

### User Management
```prisma
model User {
  id               String           @id @default(uuid())
  email            String           @unique
  name             String
  phone            String?
  dateOfBirth      DateTime?
  profilePicture   String?
  bio              String?
  
  // Authentication
  passwordHash     String?
  emailVerified    Boolean          @default(false)
  
  // Multi-club relationships
  memberships      ClubMembership[]
  eventSignups     EventSignup[]
  eventComments    EventComment[]
  
  // Timestamps
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  @@map("users")
}
```

### Multi-Club Architecture
```prisma
model Club {
  id               String           @id @default(uuid())
  name             String
  shortName        String?          // e.g., "KNS", "BSF"
  description      String?
  location         String?
  website          String?
  contactEmail     String?
  
  // Club settings
  isActive         Boolean          @default(true)
  membershipOpen   Boolean          @default(true)
  
  // Relationships
  memberships      ClubMembership[]
  events           Event[]
  
  // Timestamps
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  @@map("clubs")
}

model ClubMembership {
  id               String           @id @default(uuid())
  userId           String
  clubId           String
  
  // Membership details
  role             MembershipRole   @default(MEMBER)
  status           MembershipStatus @default(ACTIVE)
  memberNumber     String?          // Club-specific member number
  joinedAt         DateTime         @default(now())
  expiresAt        DateTime?
  
  // Relationships
  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  club             Club             @relation(fields: [clubId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  @@unique([userId, clubId])
  @@map("club_memberships")
}

enum MembershipRole {
  MEMBER
  INSTRUCTOR
  BOARD_MEMBER
  ADMIN
  SUPER_ADMIN
}

enum MembershipStatus {
  PENDING
  ACTIVE
  SUSPENDED
  EXPIRED
  CANCELLED
}
```

### Event Management
```prisma
model Event {
  id               String           @id @default(uuid())
  title            String
  description      String?
  
  // Event details
  eventType        EventType
  startTime        DateTime
  endTime          DateTime?
  location         String?
  maxParticipants  Int?
  registrationDeadline DateTime?
  
  // Organizing club
  clubId           String
  club             Club             @relation(fields: [clubId], references: [id])
  
  // Event status
  status           EventStatus      @default(SCHEDULED)
  isPublic         Boolean          @default(true)
  requiresApproval Boolean          @default(false)
  
  // Relationships
  signups          EventSignup[]
  comments         EventComment[]
  
  // Timestamps
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  @@map("events")
}

model EventSignup {
  id               String           @id @default(uuid())
  eventId          String
  userId           String
  
  // Signup details
  status           SignupStatus     @default(PENDING)
  signupTime       DateTime         @default(now())
  notes            String?
  
  // Relationships
  event            Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  @@unique([eventId, userId])
  @@map("event_signups")
}

model EventComment {
  id               String           @id @default(uuid())
  eventId          String
  userId           String
  content          String
  
  // Relationships
  event            Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  @@map("event_comments")
}

enum EventType {
  TRAINING
  REGATTA
  SOCIAL
  MEETING
  COURSE
  MAINTENANCE
  OTHER
}

enum EventStatus {
  DRAFT
  SCHEDULED
  ONGOING
  COMPLETED
  CANCELLED
  POSTPONED
}

enum SignupStatus {
  PENDING
  CONFIRMED
  WAITLIST
  CANCELLED
  NO_SHOW
}
```

### Authentication & Sessions
```prisma
model Session {
  id               String           @id @default(uuid())
  userId           String
  token            String           @unique
  
  // Session details
  expiresAt        DateTime
  userAgent        String?
  ipAddress        String?
  
  // Relationships
  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  @@map("sessions")
}

model WebAuthnCredential {
  id               String           @id @default(uuid())
  userId           String
  credentialId     String           @unique
  publicKey        String
  counter          Int              @default(0)
  deviceName       String?
  
  // Relationships
  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt        DateTime         @default(now())
  lastUsed         DateTime         @default(now())
  
  @@map("webauthn_credentials")
}
```

## Edge Database Considerations

### Data Distribution Strategy
- **Primary Region**: Europe (closest to Norwegian users)
- **Read Replicas**: Global distribution for read performance
- **Write Consistency**: Eventually consistent across regions
- **Conflict Resolution**: Last-write-wins with timestamps

### Query Optimization Patterns
```typescript
// Efficient member lookup with club context
const userWithMemberships = await db.user.findUnique({
  where: { email },
  include: {
    memberships: {
      where: { status: 'ACTIVE' },
      include: { club: true }
    }
  }
});

// Event queries with pagination
const upcomingEvents = await db.event.findMany({
  where: {
    startTime: { gte: new Date() },
    status: 'SCHEDULED'
  },
  include: {
    club: true,
    _count: { select: { signups: true } }
  },
  orderBy: { startTime: 'asc' },
  take: 20,
  skip: page * 20
});
```

### Connection Management
- **Edge Connections**: Optimized for Cloudflare Workers
- **Connection Pooling**: Automatic connection reuse
- **Timeout Handling**: Graceful degradation on timeouts
- **Retry Logic**: Exponential backoff for failed queries

## Migration Strategy

### Schema Evolution
```bash
# Development migrations
npx prisma db push          # Push schema changes to dev DB
npx prisma generate         # Regenerate Prisma client

# Production migrations
npx prisma migrate deploy   # Deploy migrations to production
npx prisma migrate status   # Check migration status
```

### Data Migration Patterns
```typescript
// Example: Adding multi-club support
async function migrateToMultiClub() {
  // Create default club for existing users
  const defaultClub = await db.club.create({
    data: {
      name: 'ILCA-KNS',
      shortName: 'KNS',
      description: 'Default club for existing members'
    }
  });
  
  // Migrate existing users to club memberships
  const users = await db.user.findMany();
  for (const user of users) {
    await db.clubMembership.create({
      data: {
        userId: user.id,
        clubId: defaultClub.id,
        role: 'MEMBER',
        joinedAt: user.createdAt
      }
    });
  }
}
```

## Performance Optimization

### Indexing Strategy
```prisma
// Composite indexes for common queries
@@index([clubId, status])     // Event filtering
@@index([userId, status])     // User memberships
@@index([startTime, status])  // Event timeline
@@unique([userId, clubId])    // Prevent duplicate memberships
```

### Query Efficiency
- **Select Specific Fields**: Avoid `select: *` queries
- **Include Relationships**: Use `include` for related data
- **Pagination**: Implement cursor-based pagination
- **Aggregations**: Use Prisma aggregation functions

### Caching Strategy
- **Edge Cache**: Cache static club and event data
- **Session Cache**: Cache user session data
- **Query Cache**: Cache common query results
- **Invalidation**: Event-based cache invalidation

## Data Consistency Patterns

### Multi-Club Consistency
- **Membership Validation**: Ensure user can only have one membership per club
- **Event Access**: Validate user can access club events
- **Permission Checks**: Role-based access control
- **Data Integrity**: Foreign key constraints and validations

### Event Management Consistency
- **Capacity Limits**: Enforce maximum participants
- **Timeline Validation**: Ensure logical event scheduling
- **Signup Deadlines**: Enforce registration deadlines
- **Status Transitions**: Valid event status changes

## Backup & Recovery

### Automated Backups
- **Daily Snapshots**: Automated daily database backups
- **Point-in-Time Recovery**: Restore to specific timestamps
- **Geographic Replication**: Multi-region backup storage
- **Testing**: Regular backup restoration testing

### Disaster Recovery
- **RTO Target**: 4 hours maximum downtime
- **RPO Target**: 1 hour maximum data loss
- **Failover Process**: Automated region failover
- **Data Validation**: Post-recovery data integrity checks