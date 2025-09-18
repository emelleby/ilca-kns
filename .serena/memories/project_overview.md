# ILCA-KNS Sailing Community Application - Project Overview

## Project Status: Active Development - Brownfield Enhancement

### Core Purpose
React-based sailing community application for the Norwegian sailing community (ILCA-KNS), designed to strengthen community connections, facilitate event participation, and improve club communication within the sailing ecosystem.

### Current Phase: Multi-Club Architecture Enhancement
- **Status**: Brownfield enhancement of existing system
- **Focus**: Supporting multiple club memberships and organizations
- **Approach**: Backward compatibility while adding new capabilities
- **Timeline**: Active development with working authentication and basic features

### Technology Stack (Current)
- **Framework**: RedwoodSDK 0.3.9 (Cloudflare Workers + React Server Components)
- **Frontend**: React 19 with Server Components, TypeScript
- **Database**: Prisma ORM with D1 SQLite (edge database)
- **Authentication**: WebAuthn + Email/Password dual system
- **Styling**: Tailwind CSS + Shadcn/UI components
- **Infrastructure**: Cloudflare Workers, D1 Database, R2 Storage
- **Design**: Mobile-first responsive design

### Key Features Implemented
- ✅ User authentication (WebAuthn + Email/Password)
- ✅ Basic member profiles
- ✅ Club information display
- ✅ Event browsing
- 🔄 Multi-club membership system (in progress)
- 🔄 Enhanced event management
- 📋 Advanced communication features (planned)

### Architecture Highlights
- **Edge-first**: Cloudflare Workers for global performance
- **React Server Components**: Server-side rendering with selective client hydration
- **Multi-tenant**: Supporting multiple sailing clubs and organizations
- **Mobile-optimized**: Primary focus on mobile user experience
- **Offline-capable**: Progressive enhancement for connectivity issues

### Development Environment
- **Package Manager**: npm
- **Development Server**: Wrangler (Cloudflare Workers local dev)
- **Database Migrations**: Prisma migrate
- **Deployment**: Cloudflare Workers platform
- **Version Control**: Git-based workflow

### Project Structure
```
src/
├── app/                 # Application routes and components
│   ├── pages/          # Page components and route handlers
│   ├── components/     # Reusable UI components
│   └── lib/           # Utility functions and helpers
├── worker.tsx          # Main Cloudflare Worker entry point
├── Document.tsx        # HTML document template
prisma/
├── schema.prisma      # Database schema definition
└── migrations/        # Database migration files
docs/
└── reference/
    └── memory-bank/   # Project documentation and context
```

### Key Constraints
- **Cloudflare Workers**: 1MB memory limit, Promise-based async patterns
- **Edge Database**: D1 SQLite limitations and edge consistency
- **Mobile-first**: Touch interfaces and responsive design priority
- **Performance**: Edge computing performance requirements

### Current Focus Areas
1. **Multi-club membership system**: Enhanced data model and UI
2. **Event management**: Advanced event features and participation tracking
3. **Mobile optimization**: Touch-friendly interfaces and offline capabilities
4. **Communication features**: Club messaging and member interactions
5. **Performance optimization**: Edge computing best practices

### Success Metrics
- User engagement with sailing events
- Multi-club membership adoption
- Mobile user experience satisfaction
- Community interaction levels
- System performance and reliability