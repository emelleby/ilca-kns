# ILCA-KNS Sailing Community Application Brownfield Enhancement PRD

## Intro Project Analysis and Context

### SCOPE ASSESSMENT

This PRD covers **SIGNIFICANT enhancements** to the existing ILCA-KNS Sailing Community Application that require comprehensive planning and multiple coordinated stories. The enhancement involves completing core platform functionality to deliver the full sailing community experience outlined in the original PRD.

### Existing Project Overview

**Analysis Source**: Document-project output available at `docs/ilca-kns-brownfield-architecture.md`

**Current Project State**: The ILCA-KNS Sailing Community Application is a React-based platform built with RedwoodSDK on Cloudflare Workers. It currently provides user authentication, comprehensive profile management with sailing-specific features, and a basic community interface. The system uses modern technologies (React 19, Prisma ORM, D1 database) with server-side rendering and follows mobile-first design principles.

### Available Documentation Analysis

**Document-project analysis available** - using existing technical documentation:
- ✅ Tech Stack Documentation (complete)
- ✅ Source Tree/Architecture (comprehensive)  
- ✅ API Documentation (RedwoodSDK patterns documented)
- ✅ External API Documentation (Resend, WebAuthn integrations)
- ✅ Technical Debt Documentation (detailed gaps identified)
- ❌ UX/UI Guidelines (partial - needs completion)

### Enhancement Scope Definition

**Enhancement Type**:
- ☑️ New Feature Addition
- ☑️ Major Feature Modification
- ☑️ UI/UX Overhaul

**Enhancement Description**: Complete the core sailing community platform by implementing dynamic content management, event calendar system, training log interfaces, media management, and coach-specific features. This transforms the current foundation into a fully functional sailing community platform.

**Impact Assessment**:
- ☑️ Significant Impact (substantial existing code changes)

### Goals and Background Context

**Goals**:
- Transform static community posts into dynamic, user-generated content system
- Implement comprehensive event calendar for sailing activities and regattas
- Build training log interfaces for sailing diary and progress tracking
- Integrate media management system for photos and videos
- Create coach dashboard for instructor-student management
- Establish content moderation and administrative tools

**Background Context**: 

The ILCA-KNS platform has a solid foundation with authentication, user profiles, and basic UI structure. However, critical gaps exist between the current implementation and the original PRD vision. The community posts system uses static mock data, essential sailing community features like event calendars and training logs are missing, and there's no content creation or media management capability.

This enhancement bridges that gap by implementing the remaining core features needed for a complete sailing community platform, building on the existing RedwoodSDK architecture and maintaining compatibility with current user and profile systems.

## Competitive Analysis

### Sailing & Sports Community Platforms Research

**Analysis Methodology**: Evaluated leading sailing and sports community platforms to identify best practices, common patterns, and opportunities for differentiation in our ILCA-KNS enhancement strategy.

#### Platform Analysis Summary

**1. SailRacer (sailracer.net)**
- **Strengths**: Comprehensive regatta management, real-time race tracking, detailed results database
- **Community Features**: Basic forums, event listings, photo galleries
- **Key Insight**: Heavy focus on competitive sailing with limited training/educational content
- **Relevance**: Shows importance of event management but lacks personal development tracking

**2. Strava (strava.com) - Sailing Segment**
- **Strengths**: Excellent activity tracking, social feed, segment competitions, mobile-first design
- **Community Features**: Activity feeds, kudos system, athlete following, group challenges
- **Key Insight**: Superior personal tracking and social engagement through activity streams
- **Relevance**: Strong model for training log interfaces and social interaction patterns

**3. YachtBot (yachtbot.com)**
- **Strengths**: Live race tracking, spectator engagement, regatta administration tools
- **Community Features**: Event discovery, team management, basic messaging
- **Key Insight**: Focus on event experience but limited community building outside events
- **Relevance**: Good reference for event calendar functionality and RSVP systems

**4. iSail (isail.com.au) - Sailing Community**
- **Strengths**: Integrated coaching tools, skill development tracking, lesson booking
- **Community Features**: Coach-student connections, progress sharing, achievement badges
- **Key Insight**: Strong coach-student relationship management and structured learning paths
- **Relevance**: Excellent model for our coach dashboard and training log requirements

**5. TeamSnap (teamsnap.com) - Sports Team Management**
- **Strengths**: Event scheduling, team communication, attendance tracking, media sharing
- **Community Features**: Team feeds, photo/video sharing, group messaging, role-based access
- **Key Insight**: Excellent team/group management with clear role separation
- **Relevance**: Strong patterns for role-based features and group event management

#### Key Insights & Competitive Advantages

**Market Gaps Identified**:
- **Integrated Learning Path**: Most platforms focus either on competition OR training, not integrated development
- **Local Club Focus**: Many platforms are too broad or too niche; opportunity for sailing club-specific features
- **Coach-Student Integration**: Limited platforms effectively bridge coaching and community aspects
- **Mobile-Native Design**: Many sailing platforms have poor mobile experiences

**ILCA-KNS Competitive Positioning**:
- **Holistic Sailing Development**: Combines competition, training, and community in one platform
- **Club-Centric Design**: Built specifically for sailing club communities rather than generic sports
- **Modern Tech Stack**: RedwoodSDK provides superior mobile experience compared to legacy sailing platforms
- **Integrated Coaching**: Seamless coach-student workflows missing from most competitors

#### Feature Benchmarking & Recommendations

**Content Management (Posts/Blog)**:
- **Industry Standard**: Rich text, photo galleries, video embedding, social interactions (likes/comments)
- **Best Practice**: Strava's activity feed model with automatic post generation from training logs
- **Recommendation**: Implement rich text editor with media embedding, but add unique sailing-specific content templates

**Event Calendar & Management**:
- **Industry Standard**: Calendar views, RSVP systems, event categories, reminder notifications
- **Best Practice**: TeamSnap's comprehensive event management with attendance tracking
- **Recommendation**: Focus on sailing-specific event types (regattas, training sessions, social events) with weather integration

**Training Logs & Progress Tracking**:
- **Industry Standard**: Activity logging, progress visualization, goal setting, sharing capabilities
- **Best Practice**: Strava's segment tracking + iSail's skill development tracking
- **Recommendation**: Combine quantitative tracking (hours, conditions) with qualitative development (skills, experiences)

**Coach-Student Management**:
- **Industry Standard**: Assignment systems, progress viewing, communication tools, feedback mechanisms
- **Best Practice**: iSail's structured coaching workflows with achievement tracking
- **Recommendation**: Build on existing profile system to create seamless coach assignment and progress monitoring

**Media Management**:
- **Industry Standard**: Photo/video upload, gallery organization, sharing controls, mobile optimization
- **Best Practice**: TeamSnap's integrated media sharing with event association
- **Recommendation**: Leverage Cloudflare R2 for superior media performance with sailing-specific organization (by boat, event, training session)

#### Implementation Priorities Based on Competitive Analysis

**High Competitive Value**:
1. **Integrated Training-Community Feed**: Unique combination not well-served by existing platforms
2. **Sailing-Specific Content Templates**: Weather conditions, boat setup, technique focus areas
3. **Coach Dashboard with Progress Visualization**: More comprehensive than most sailing platforms

**Table Stakes Features**:
1. **Rich Text Editor with Media**: Standard expectation across all modern platforms
2. **Event Calendar with RSVP**: Basic requirement for any community platform
3. **Mobile-Responsive Design**: Critical for user adoption in sailing community

**Differentiation Opportunities**:
1. **Weather Integration**: Connect training logs and events with actual sailing conditions
2. **Boat Setup Sharing**: Community knowledge sharing around rigging and configuration
3. **Skill Development Pathways**: Structured progression tracking unique to sailing education

## User Journey Mapping

### Key User Personas & Multi-Role Scenarios

**Primary Insight**: Users in sailing communities often have overlapping roles and multi-club affiliations that require flexible system design.

#### Persona 1: Multi-Club Sailor (Emma)
**Profile**: Active sailor, member of 2 clubs (home club + university club), participates in different training groups
**Key Needs**: Context switching between clubs, managing different group communications, unified training log across clubs

#### Persona 2: Coach-Sailor (Marcus)
**Profile**: Experienced sailor who coaches junior group at home club while still competing and training personally
**Key Needs**: Separate coach/sailor dashboards, manage student progress while tracking own development, dual content creation

#### Persona 3: Multi-Group Coach (Sarah)
**Profile**: Head coach responsible for 3 different training groups (beginners, intermediate, racing team)
**Key Needs**: Efficient group management, differentiated content for different skill levels, progress tracking across groups

#### Persona 4: Club Admin-Sailor (Lars)
**Profile**: Club administrator who also sails and occasionally coaches, manages club-wide events and communications
**Key Needs**: Administrative oversight, event management, content moderation, personal sailing activity tracking

### Critical User Journeys

#### Journey 1: Multi-Club Training Log Management
**Scenario**: Emma trains at University Sailing Club on weekdays, home club on weekends

**Current Pain Points**: Separate systems, fragmented training history, difficulty sharing progress with different coaches

**Enhanced Journey**:
1. **Club Context Selection**: Choose active club context from header dropdown
2. **Unified Training Log**: Create training entry with club association, visible to appropriate coaches
3. **Cross-Club Visibility**: Coaches see relevant training regardless of club (with permissions)
4. **Aggregated Progress**: Personal dashboard shows combined progress across all clubs
5. **Context-Aware Notifications**: Receive club-specific event and training notifications

**Technical Requirements**:
- Club membership model allowing multiple affiliations
- Context-switching UI component
- Permission system respecting club boundaries
- Aggregated data views across clubs

#### Journey 2: Coach-Sailor Role Switching
**Scenario**: Marcus coaches junior group Tuesday/Thursday, trains personally Saturday, competes Sunday

**Current Pain Points**: Role confusion, separate interfaces, difficulty managing dual identity

**Enhanced Journey**:
1. **Role Toggle**: Dashboard header shows current role (Coach/Sailor) with easy switching
2. **Coach Mode**: Access student roster, training plans, progress tracking for junior group
3. **Sailor Mode**: Personal training log, event registration, peer community interactions  
4. **Dual Content Creation**: Create posts as coach (instructional) or sailor (personal experience)
5. **Integrated Calendar**: View coaching commitments alongside personal training/events

**Technical Requirements**:
- Role-based UI rendering
- Permission context switching
- Dual content ownership models
- Integrated scheduling system

#### Journey 3: Multi-Group Coach Management
**Scenario**: Sarah manages beginners (Monday), intermediate (Wednesday), racing team (Friday/Saturday)

**Current Pain Points**: Group context confusion, different communication needs per group, progress tracking complexity

**Enhanced Journey**:
1. **Group Dashboard**: Overview of all assigned groups with quick stats
2. **Group-Specific Content**: Create training posts targeted to specific skill levels
3. **Differentiated Communication**: Send announcements to specific groups or all groups
4. **Progress Comparison**: View individual and group progress across different skill levels
5. **Resource Management**: Share different training materials appropriate for each group

**Technical Requirements**:
- Training group hierarchy model
- Group-targeted content system
- Multi-audience communication tools
- Comparative analytics dashboard

#### Journey 4: Event Management Across Roles
**Scenario**: Lars organizes club regatta as admin, participates as sailor, helps coach junior sailors during event

**Current Pain Points**: Administrative overhead, role confusion during events, communication complexity

**Enhanced Journey**:
1. **Event Creation**: Admin creates regatta with multiple participation categories
2. **Multi-Role Registration**: Register as participant while maintaining admin oversight
3. **Real-Time Management**: Monitor registrations, communicate updates, handle logistics
4. **During Event**: Switch between admin (managing), coach (supporting juniors), sailor (competing) roles
5. **Post-Event**: Collect results, gather feedback, create community content about event

**Technical Requirements**:
- Event management with role-based permissions
- Multi-role event participation
- Real-time communication system
- Post-event workflow automation

### Cross-Journey Requirements

#### Data Model Implications

**Club Membership Model**:
- User can belong to multiple clubs with different roles per club
- Club-specific permissions and visibility rules
- Training group memberships within clubs
- Coach assignments can span multiple groups/clubs

**Content Visibility Matrix**:
- Personal content: Visible to user and assigned coaches across all clubs
- Group content: Visible to group members and coaches
- Club content: Visible to club members with appropriate permissions
- Public content: Visible to all platform users

**Role Permission System**:
- Base roles: Sailor, Coach, Admin, SuperUser
- Context-specific roles: Club Admin, Group Coach, Group Member
- Permission inheritance and override rules
- Temporary role elevation (e.g., event management)

#### UI/UX Design Requirements

**Context Awareness**:
- Clear visual indicators of current club/group/role context
- Easy context switching without navigation disruption
- Breadcrumb navigation showing club > group > content hierarchy
- Dashboard customization based on active roles

**Information Architecture**:
- Personal space: Cross-club training logs, personal calendar, achievements
- Club spaces: Club-specific events, news, member communications
- Group spaces: Training plans, group progress, coach communications
- Administrative spaces: Management tools, moderation queues, analytics

**Navigation Patterns**:
- Primary navigation: Personal, Clubs, Groups, Admin (if applicable)
- Secondary navigation: Context-specific features within each primary area
- Quick actions: Role switching, context switching, content creation
- Search: Scope-aware search (personal, club, group, global)

### Journey Validation Requirements

**Story Acceptance Criteria Updates**:
Each story must validate these multi-role scenarios:
- Context switching works smoothly without data loss
- Permissions respect club and group boundaries
- Role-based features appear/disappear appropriately
- Content visibility follows defined matrix
- Performance remains acceptable with multiple contexts loaded

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD | 2025-01-10 | 1.0 | Brownfield enhancement for core platform completion | John (PM) |

## Requirements

### Functional Requirements

- **FR1**: The existing community posts UI will integrate with dynamic database storage, replacing static mock data while maintaining current PostCard and PostList component interfaces.

- **FR2**: Users will be able to create, edit, and delete blog posts using a rich text editor with media embedding capabilities, integrated with the existing authentication system.

- **FR3**: The system will provide a comprehensive event calendar interface for sailing events, regattas, and training sessions with RSVP functionality.

- **FR4**: Users will be able to create and manage personal training log entries including sailing diary, training hours, and boat setup configurations using the existing profile system foundation.

- **FR5**: The platform will support media upload and management through Cloudflare R2 integration, enabling image and video attachments to posts and training logs.

- **FR6**: Coach users will have access to specialized dashboard features for managing assigned students, viewing their progress, and providing feedback on training logs.

- **FR7**: Admin users will have content moderation tools for reviewing, approving, and managing user-generated content across the platform.

- **FR8**: The system will provide sailing-specific content templates and weather integration for training logs and event posts, differentiating from generic sports platforms.

- **FR9**: The platform will support automatic activity feed generation from training logs, following industry best practices from leading fitness community platforms.

- **FR10**: Users will be able to maintain memberships in multiple clubs with different roles per club (sailor, coach, admin) and easily switch between club contexts.

- **FR11**: Coaches will be able to manage multiple training groups within and across clubs, with group-specific content creation and communication capabilities.

- **FR12**: The system will support overlapping user roles where a single user can simultaneously be a sailor, coach, and/or administrator with appropriate context switching.

- **FR13**: Training logs and progress tracking will aggregate data across multiple club memberships while respecting club-specific privacy and visibility rules.

### Non-Functional Requirements

- **NFR1**: Enhancement must maintain existing RedwoodSDK server component patterns and Cloudflare Workers compatibility requirements.

- **NFR2**: All new features must integrate with the current dual authentication system (WebAuthn + email/password) without breaking existing user sessions.

- **NFR3**: Database changes must be backward compatible with existing User and Profile schemas, using additive migration patterns only.

- **NFR4**: New UI components must follow existing Shadcn/UI design system and mobile-first responsive patterns.

- **NFR5**: Performance must remain under 2 seconds page load time as specified in original technical requirements.

### Compatibility Requirements

- **CR1**: All new API endpoints must follow existing RedwoodSDK routing patterns and maintain compatibility with current session management via Durable Objects.

- **CR2**: Database schema changes must preserve existing User and Profile data integrity and relationships without requiring data migration.

- **CR3**: New UI components must maintain visual consistency with existing HomeLayout, navigation patterns, and Tailwind CSS styling approach.

- **CR4**: Integration with existing services (Resend email, WebAuthn) must remain intact and functional throughout enhancement deployment.

## User Interface Enhancement Goals

### Integration with Existing UI

New UI elements will seamlessly integrate with the existing Shadcn/UI component library and Tailwind CSS design system. The enhancement will extend the current HomeLayout structure, maintaining the established navigation patterns and responsive breakpoints. Rich text editors will use compatible styling that matches existing form components, and new calendar interfaces will follow the established card-based layout patterns seen in the current PostCard components.

### Modified/New Screens and Views

**Modified Screens**:
- `/home` - Enhanced community feed with post creation capabilities
- `/user/:username/profile` - Extended with training log entries and activity timeline
- `/superuser/dashboard` - Enhanced with content moderation tools

**New Screens**:
- `/posts/create` - Rich text post creation interface
- `/posts/:id/edit` - Post editing interface
- `/calendar` - Event calendar main view
- `/calendar/event/:id` - Event details and RSVP interface
- `/training` - Personal training log dashboard
- `/training/entry/create` - Training log entry creation
- `/coach/dashboard` - Coach-specific student management interface
- `/admin/content` - Content moderation queue

### UI Consistency Requirements

- All new forms must use existing input component patterns from `/src/app/components/ui/`
- Navigation additions must integrate with current header structure in `HomeLayout.tsx`
- Modal dialogs must use existing Dialog component patterns
- Color scheme must maintain current primary/secondary color palette
- Typography must follow existing Tailwind typography classes
- Mobile-first responsive design must match current breakpoint strategy
- Loading states must use existing skeleton component patterns
- Error handling must follow current toast notification patterns

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: TypeScript, TSX (React with TypeScript)  
**Frameworks**: RedwoodSDK 0.0.85, React 19.0.0  
**Database**: Cloudflare D1 (SQLite-based) with Prisma ORM 6.8.2  
**Infrastructure**: Cloudflare Workers, Cloudflare R2 Storage, Durable Objects  
**External Dependencies**: Resend API (email), WebAuthn (authentication), Shadcn/UI components

### Integration Approach

**Database Integration Strategy**: Extend existing Prisma schema with enhanced multi-club support building on existing Organization/OrganizationMembership foundation. Add Club and TrainingGroup models with many-to-many relationships supporting multiple club memberships per user. Implement role-based permissions at club and group levels (ClubMembership with role field, GroupMembership for training groups). Add Post, Comment, Event, and TrainingLog models with club/group context awareness and proper visibility controls. Maintain existing User/Profile relationships while adding new foreign key relationships for multi-role scenarios without breaking current data integrity.</search>
</search_and_replace>

**API Integration Strategy**: Follow established RedwoodSDK server function patterns with "use server" directives for database operations. Implement new API routes following existing user routes structure in `/src/app/pages/user/routes.tsx`. Maintain compatibility with current session management via Durable Objects.

**Frontend Integration Strategy**: Extend existing component architecture using server components for data fetching and client components ("use client") for interactivity. Maintain current HomeLayout structure and extend navigation. Follow established patterns in PostCard/PostList components for new content types.

**Testing Integration Strategy**: Build on existing manual testing approach. Implement new features with backward compatibility verification to ensure existing user authentication and profile functionality remains intact.

### Code Organization and Standards

**File Structure Approach**: Follow existing pattern with new features in dedicated directories under `/src/app/pages/` (e.g., `/calendar/`, `/training/`, `/posts/`). Place shared components in `/src/app/components/` and maintain separation between UI components (`/ui/`) and feature components.

**Naming Conventions**: Maintain current PascalCase for components, camelCase for functions, and existing database naming patterns. Follow established file naming with descriptive component names and co-located functions.

**Coding Standards**: Continue RedwoodSDK patterns with clear server/client component separation. Maintain existing TypeScript strict mode, Prettier formatting, and current import organization patterns.

**Documentation Standards**: Update existing memory-bank documentation patterns with new feature documentation. Maintain architectural decision records in memory-bank for significant technical choices.

### Deployment and Operations

**Build Process Integration**: Extend existing Vite build process without modification. New features will be included in current `pnpm build` workflow. Maintain compatibility with existing `pnpm release` Cloudflare Workers deployment.

**Deployment Strategy**: Follow current staged deployment approach using existing Cloudflare Workers environment. Use existing database migration workflow (`pnpm migrate:dev` for local, `pnpm migrate:prd` for production).

**Monitoring and Logging**: Utilize existing Cloudflare Workers logging and error reporting. Maintain current development/production logging patterns and error boundary implementations.

**Configuration Management**: Extend existing environment variable pattern in `wrangler.jsonc` for any new service integrations. Maintain current secrets management through Cloudflare Workers environment variables.

### Risk Assessment and Mitigation

**Technical Risks**: 
- Cloudflare Workers Promise handling complexity may impact new async operations
- Large media uploads may exceed Workers memory limits
- Complex calendar UI may impact mobile performance targets

**Integration Risks**:
- Database schema changes could affect existing profile auto-creation system
- New server components may conflict with existing Suspense boundary patterns
- R2 storage integration may require new authentication flow complexity

**Deployment Risks**:
- Multiple new database tables increase migration complexity
- New rich text editor dependencies may increase bundle size beyond Workers limits
- Content moderation features may require additional external service integrations

**Mitigation Strategies**:
- Implement progressive enhancement with feature flags for gradual rollout
- Use existing RedwoodSDK patterns proven to work with Cloudflare Workers constraints
- Maintain backward compatibility through additive-only database changes
- Test thoroughly in development environment before production deployment
- Implement proper error boundaries and fallback states for all new features

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: Single comprehensive epic with rationale - The enhancement involves highly interconnected features (posts, events, training logs, media) that share common infrastructure (database models, UI patterns, media management). A single epic approach allows for coordinated database schema evolution, shared component development, incremental value delivery, and consistent risk management across all features.

## Epic 1: Complete Sailing Community Platform

**Epic Goal**: Transform the ILCA-KNS platform from a basic user management system into a fully functional sailing community platform by implementing dynamic content management, event coordination, training tracking, and coach-student interaction capabilities.

**Integration Requirements**: All new features must seamlessly integrate with existing authentication, profile management, and navigation systems while maintaining RedwoodSDK patterns and Cloudflare Workers compatibility.

### Story 1.1: Database Foundation & Dynamic Post Management

As a **community member**,  
I want **the existing community posts interface to display real user-generated content from the database**,  
so that **I can see actual community activity instead of static placeholder content**.

#### Acceptance Criteria

1. Extend existing Prisma schema with multi-club infrastructure: Club, ClubMembership, TrainingGroup, and GroupMembership models building on existing Organization foundation
2. Add Post, Comment, and Like models with club/group context awareness and visibility controls for multi-role scenarios
3. Replace static mock data in PostList component with dynamic database queries using RedwoodSDK server components, respecting club context
4. Maintain existing PostCard component interface while connecting to real database records with club/group associations
5. Implement basic CRUD operations for posts through server functions with proper multi-club permission checks
6. Add club context switching UI component to header for multi-club users
7. Ensure existing authentication and profile systems continue to function unchanged with new club relationships

#### Integration Verification

- **IV1**: Verify existing user authentication flow remains intact and functional
- **IV2**: Confirm existing profile pages and navigation continue to work without errors
- **IV3**: Validate that existing HomeLayout and component styling remain consistent

### Story 1.2: Rich Content Creation & Media Upload Infrastructure

As a **community member**,  
I want **to create and edit posts with rich text formatting and media attachments**,  
so that **I can share detailed sailing experiences with photos and formatted content**.

#### Acceptance Criteria

1. Implement rich text editor component integrated with existing Shadcn/UI design system
2. Create media upload system using Cloudflare R2 with proper authentication integration
3. Add post creation and editing interfaces following existing UI patterns
4. Implement media management for images and videos with proper storage metadata
5. Ensure media uploads respect performance constraints and Cloudflare Workers limits

#### Integration Verification

- **IV1**: Verify rich text editor follows existing form component patterns and styling
- **IV2**: Confirm media upload integration doesn't break existing file handling or authentication
- **IV3**: Validate that new creation flows maintain existing navigation and layout consistency

### Story 1.3: Event Calendar System

As a **sailing club member**,  
I want **to view and manage sailing events, regattas, and training sessions in a calendar interface**,  
so that **I can stay informed about community activities and RSVP to events**.

#### Acceptance Criteria

1. Create Event model and database schema with relationships to existing User model
2. Implement calendar interface using compatible UI components that match existing design
3. Add event creation, editing, and RSVP functionality for authenticated users
4. Integrate event management with existing role-based permissions (USER/SUPERUSER)
5. Ensure calendar displays properly on mobile devices following existing responsive patterns

#### Integration Verification

- **IV1**: Verify event creation integrates properly with existing authentication and user roles
- **IV2**: Confirm calendar interface maintains existing navigation and responsive design patterns
- **IV3**: Validate that event data doesn't conflict with existing database relationships

### Story 1.4: Training Log Interface

As a **sailor**,  
I want **to create and manage detailed training log entries including sailing diary, hours tracking, and boat setup configurations**,  
so that **I can track my progress and share experiences with coaches and fellow sailors**.

#### Acceptance Criteria

1. Extend existing Profile system with TrainingLog model and related sailing-specific data structures
2. Create training log entry interfaces that build on existing profile management patterns
3. Implement boat setup recording, weather conditions, and training duration tracking
4. Add privacy controls for training logs leveraging existing profile privacy settings
5. Ensure training logs integrate with existing profile viewing and editing workflows

#### Integration Verification

- **IV1**: Verify training log integration doesn't break existing profile creation or editing functionality
- **IV2**: Confirm training log privacy settings work consistently with existing profile privacy controls
- **IV3**: Validate that training log data displays properly in existing profile viewing interfaces

### Story 1.5: Coach Dashboard & Student Management

As a **sailing coach**,  
I want **specialized dashboard features for managing assigned students and viewing their training progress**,  
so that **I can provide effective guidance and track student development**.

#### Acceptance Criteria

1. Extend existing role system to support coach-student relationships and permissions
2. Create coach dashboard interface following existing admin dashboard patterns
3. Implement student assignment and progress viewing capabilities
4. Add feedback and communication features between coaches and students
5. Ensure coach features integrate with existing superuser permissions and role management

#### Integration Verification

- **IV1**: Verify coach role integration doesn't break existing USER/SUPERUSER role functionality
- **IV2**: Confirm coach dashboard follows existing admin interface patterns and navigation
- **IV3**: Validate that coach-student relationships don't conflict with existing user management

### Story 1.6: Content Moderation & Admin Tools

As a **platform administrator**,  
I want **comprehensive content moderation tools for reviewing and managing user-generated content**,  
so that **I can maintain community standards and platform quality**.

#### Acceptance Criteria

1. Extend existing superuser dashboard with content moderation queue and tools
2. Implement content flagging, review, and approval workflows
3. Add bulk actions for content management and user communication
4. Create reporting and analytics features for platform oversight
5. Ensure moderation tools integrate with existing admin role permissions

#### Integration Verification

- **IV1**: Verify content moderation extends existing superuser dashboard without breaking current functionality
- **IV2**: Confirm moderation workflows integrate properly with existing user management and permissions
- **IV3**: Validate that moderation actions maintain data integrity with existing user and content relationships
