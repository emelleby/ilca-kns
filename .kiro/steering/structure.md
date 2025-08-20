# Project Structure

## Root Level
- `src/` - Main application source code
- `prisma/` - Database schema and migrations
- `migrations/` - SQL migration files
- `public/` - Static assets (images, etc.)
- `memory-bank/` - Project documentation and context
- `.kiro/` - Kiro AI assistant configuration
- Various config files (vite, tailwind, tsconfig, wrangler)

## Source Code Organization (`src/`)

### Core Files
- `worker.tsx` - Cloudflare Worker entry point
- `client.tsx` - Client-side entry point
- `db.ts` - Database configuration and Prisma setup

### Application Structure (`src/app/`)
- `components/` - Reusable React components
  - `ui/` - Shadcn/ui components (Button, Input, Dialog, etc.)
  - Feature-specific components (PostCard, ProfileEditForm, etc.)
- `pages/` - Page components organized by feature
  - `user/` - User authentication and profile pages
  - `admin/` - Admin functionality
  - `superuser/` - Superuser dashboard
- `layouts/` - Layout components
- `lib/` - Utility functions and helpers
- `shared/` - Shared constants and configuration

### Session Management (`src/session/`)
- `durableObject.ts` - Durable Object for session storage
- `store.ts` - Session store implementation

### Scripts (`src/scripts/`)
- `seed.ts` - Database seeding script

## Key Conventions

### File Naming
- React components: PascalCase (e.g., `PostCard.tsx`)
- Utility files: camelCase (e.g., `utils.ts`)
- Page components: PascalCase with descriptive names

### Import Aliases
- `@/*` - Maps to `src/*` for clean imports
- `@generated/*` - Maps to `generated/*` for Prisma client

### Component Organization
- UI components in `components/ui/` follow Shadcn/ui patterns
- Feature components grouped logically
- Pages organized by user role/feature area

### Database
- Prisma schema in `prisma/schema.prisma`
- Generated client in `generated/prisma/`
- Migrations in `migrations/` directory with numbered SQL files