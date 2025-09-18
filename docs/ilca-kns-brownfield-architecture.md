# ILCA-KNS Sailing Community Application Brownfield Architecture Document

## Introduction

This document captures the **CURRENT STATE** of the ILCA-KNS Sailing Community Application codebase, including implemented features, technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements and provides a realistic view of what exists versus what was originally planned.

### Document Scope

Comprehensive documentation of the entire system based on the existing PRD for a sailing community platform, focusing on areas that have been implemented and identifying gaps for future development.

### Change Log

| Date       | Version | Description                 | Author    |
| ---------- | ------- | --------------------------- | --------- |
| 2025-01-10 | 1.0     | Initial brownfield analysis | Winston   |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: [`src/worker.tsx`](src/worker.tsx:1) (Cloudflare Workers entry point)
- **Configuration**: [`wrangler.jsonc`](wrangler.jsonc:1), [`.env.example`](.env.example:1)
- **Database Schema**: [`prisma/schema.prisma`](prisma/schema.prisma:1)
- **Core Routing**: [`src/app/pages/user/routes.tsx`](src/app/pages/user/routes.tsx:1), [`src/app/pages/superuser/routes.tsx`](src/app/pages/superuser/routes.tsx:1)
- **Main Layout**: [`src/app/layouts/HomeLayout.tsx`](src/app/layouts/HomeLayout.tsx:1)
- **Session Management**: [`src/session/store.ts`](src/session/store.ts:1), [`src/session/durableObject.ts`](src/session/durableObject.ts:1)

### Enhancement Impact Areas

Based on the PRD requirements, these areas will need development:

- **Community Blog/News**: Partially implemented with static mock data in [`src/app/components/PostList.tsx`](src/app/components/PostList.tsx:1)
- **Training Logs & Sailing Diary**: Database schema exists but no UI implementation
- **Calendar & Events**: Not implemented beyond placeholder navigation
- **Admin Dashboard**: Basic superuser dashboard exists at [`src/app/pages/superuser/Dashboard.tsx`](src/app/pages/superuser/Dashboard.tsx:1)

## High Level Architecture

### Technical Summary

A modern React-based sailing community platform built with RedwoodSDK on Cloudflare Workers. The system implements server-side rendering with React Server Components, uses Prisma ORM with D1 database, and follows a mobile-first design approach.

### Actual Tech Stack (from package.json)

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

### Repository Structure Reality Check

- Type: **Monorepo** (single repository for entire application)
- Package Manager: **pnpm** (version 9.15.3)
- Notable: **Cloudflare Workers-specific configuration** with special Prisma setup for edge runtime

## Source Tree and Module Organization

### Project Structure (Actual)

```text
ilcakns/
├── src/
│   ├── app/
│   │   ├── components/           # React components
│   │   │   ├── ui/              # Shadcn UI components
│   │   │   ├── PostCard.tsx     # Blog post display (static data)
│   │   │   ├── PostList.tsx     # Post feed (mock implementation)
│   │   │   ├── UserProfileSidebar.tsx # Profile widget
│   │   │   └── ProfileEditForm.tsx    # Profile editing form
│   │   ├── layouts/
│   │   │   ├── HomeLayout.tsx   # Main application layout
│   │   │   ├── AuthLayout.tsx   # Authentication pages layout
│   │   │   └── components/      # Layout-specific components
│   │   ├── pages/               # Route components
│   │   │   ├── Home.tsx         # Main community feed page
│   │   │   ├── FrontPage.tsx    # Landing page for unauthenticated users
│   │   │   ├── user/            # User management routes
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Signup.tsx
│   │   │   │   ├── profile/     # Profile management
│   │   │   │   └── settings/    # User settings
│   │   │   ├── superuser/       # Admin functionality
│   │   │   └── admin/           # Additional admin features (placeholder)
│   │   ├── auth/                # Authentication utilities
│   │   ├── shared/              # Shared utilities and constants
│   │   └── hooks/               # React hooks
│   ├── session/                 # Session management (Durable Objects)
│   ├── scripts/                 # Database seeding and utilities
│   └── worker.tsx               # Cloudflare Workers entry point
├── prisma/
│   └── schema.prisma            # Database schema definition
├── migrations/                  # Database migration files
├── memory-bank/                 # Project documentation and patterns
├── tasks/                       # Task management files
├── public/                      # Static assets
└── types/                       # TypeScript type definitions
```

### Key Modules and Their Purpose

- **Authentication System**: [`src/app/pages/user/`](src/app/pages/user/) - Dual auth with WebAuthn and email/password
- **Profile Management**: [`src/app/pages/user/profile/`](src/app/pages/user/profile/) - Comprehensive sailing profile system
- **Session Management**: [`src/session/`](src/session/) - Durable Objects-based session storage
- **Community Feed**: [`src/app/components/PostList.tsx`](src/app/components/PostList.tsx:1) - Static mock posts, needs database integration
- **Admin Dashboard**: [`src/app/pages/superuser/`](src/app/pages/superuser/) - Basic user management interface
- **Layout System**: [`src/app/layouts/`](src/app/layouts/) - Responsive layout components

## Data Models and APIs

### Database Schema

The system uses Prisma with D1 database. Key models include:

- **User Model**: See [`prisma/schema.prisma:24`](prisma/schema.prisma:24) - Core user entity with role-based access
- **Profile Model**: See [`prisma/schema.prisma:77`](prisma/schema.prisma:77) - Sailing-specific profile data
- **Post Model**: See [`prisma/schema.prisma:99`](prisma/schema.prisma:99) - Blog/news content structure
- **Organization Models**: See [`prisma/schema.prisma:55`](prisma/schema.prisma:55) - Multi-tenant organization support
- **Authentication Models**: [`Credential`](prisma/schema.prisma:41), [`PasswordReset`](prisma/schema.prisma:134) - Dual auth support

### API Patterns

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

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Community Posts System**: Currently using static mock data in [`PostList.tsx`](src/app/components/PostList.tsx:20) instead of database integration
2. **Calendar/Events System**: Database schema exists but no implementation beyond placeholder navigation
3. **Training Logs**: Profile schema supports sailing data but no dedicated training log interface
4. **Media Upload**: R2 storage configured but no upload interface implemented
5. **Email Configuration**: Development mode sends all emails to single address - needs production configuration

### Implementation Gaps vs PRD

Based on the PRD requirements, these features are missing:

- **Rich Text Editor**: No WYSIWYG editor for post creation
- **Media Management**: Image upload and gallery features not implemented
- **Event Management**: Calendar functionality exists in navigation but not implemented
- **Coach Dashboard**: No specialized interface for coaches to manage students
- **Advanced Profile Features**: Boat setup recording, training hour tracking need UI
- **Content Moderation**: Admin tools for content review not implemented

### Workarounds and Gotchas

- **Prisma Configuration**: Special configuration for Cloudflare Workers runtime in [`schema.prisma:7`](prisma/schema.prisma:7)
- **Session Storage**: Uses Durable Objects instead of traditional session storage
- **Database Migrations**: Manual process using `pnpm migrate:new "name"` followed by server restart
- **Static JSON Data**: Tasks system uses static JSON files instead of database storage
- **Development Emails**: All emails redirect to development address in current configuration

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

### Testing Reality

- **Unit Tests**: Not implemented
- **Integration Tests**: Not implemented  
- **E2E Tests**: Not implemented
- **Manual Testing**: Primary QA method
- **Type Checking**: `pnpm types` for TypeScript validation

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
3. **Role-Based Access**: Simple USER/SUPERUSER model with potential for expansion
4. **Mobile-First Design**: Responsive layouts prioritizing mobile experience
5. **Static-First Development**: Mock data for rapid prototyping, gradual database integration

## Current Implementation Status

### ✅ Fully Implemented

- User registration and authentication (dual methods)
- User profile management with sailing-specific fields
- Password reset functionality  
- Basic admin dashboard for superusers
- Responsive layout system
- Session management with Durable Objects
- Database schema for most features

### 🔄 Partially Implemented

- Community blog/news system (UI exists, uses static data)
- Navigation structure (complete but links to unimplemented features)
- Organization management (database schema exists, basic UI)

### ❌ Not Implemented

- Rich content creation and editing
- Event calendar and management
- Training log interface
- Coach-specific features
- Media upload and management
- Content moderation tools
- Advanced reporting and analytics

## Enhancement Recommendations

### High Priority (Core Platform Features)

1. **Database Integration for Posts**: Replace static data with real database queries
2. **Rich Text Editor**: Implement WYSIWYG editor for content creation
3. **Media Upload System**: Integrate R2 storage with upload interface
4. **Event Calendar**: Build calendar interface with CRUD operations

### Medium Priority (User Experience)

1. **Training Log Interface**: Build UI for sailing diary and training tracking
2. **Coach Dashboard**: Specialized interface for student management
3. **Email Configuration**: Production-ready email setup with templates
4. **Search Functionality**: Global search across posts and profiles

### Low Priority (Administrative)

1. **Content Moderation**: Admin tools for reviewing and managing content
2. **Analytics Dashboard**: Usage statistics and user engagement metrics
3. **Advanced Profile Features**: Boat setup wizards, certification management
4. **API Documentation**: OpenAPI specification for potential integrations

## Appendix - Useful Commands and Scripts

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

### Debugging and Troubleshooting

- **Logs**: Check Cloudflare Workers logs in dashboard
- **Local Database**: SQLite file in `.wrangler/state/`
- **Hot Reload Issues**: Restart server after schema changes
- **Promise Errors**: Check [`memory-bank/techContext.md`](memory-bank/techContext.md) for patterns

### Key Documentation Files

- **Technical Patterns**: [`memory-bank/redwoodSDKPatterns.md`](memory-bank/redwoodSDKPatterns.md)
- **System Patterns**: [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md)  
- **Progress Tracking**: [`memory-bank/progress.md`](memory-bank/progress.md)
- **Project Brief**: [`memory-bank/projectbrief.md`](memory-bank/projectbrief.md)
- **Original PRD**: [`scripts/Product Requirements Document (PRD).md`](scripts/Product%20Requirements%20Document%20(PRD).md)

---

*This document provides a realistic assessment of the current system state and serves as a foundation for continued development toward the full PRD vision.*