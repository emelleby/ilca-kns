# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Development Commands

**Build and Development:**
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm types` - Run TypeScript type checking
- `pnpm check` - Generate types and run type checking

**Database Operations:**
- `pnpm migrate:dev` - Apply migrations locally (generates Prisma client)
- `pnpm migrate:prd` - Apply migrations to production
- `pnpm migrate:new` - Create new migration
- `pnpm seed` - Seed database with test data
- `pnpm generate` - Generate Prisma client and Wrangler types

**Deployment:**
- `pnpm release` - Full deployment pipeline (clean, generate, build, deploy)

## Architecture Overview

**Framework:** RedwoodSDK on Cloudflare Workers with React Server Components (RSC) and SSR

**Key Technologies:**
- **Frontend:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui components
- **Backend:** Cloudflare Workers, Prisma ORM, D1 SQLite database
- **Authentication:** WebAuthn/Passkey authentication via SimpleWebAuthn
- **Storage:** R2 buckets, Durable Objects for session management
- **Build:** Vite, pnpm package manager

**Project Structure:**
- `src/app/` - Main application code (pages, components, layouts)
- `src/app/pages/` - Page components organized by feature
- `src/app/components/` - Reusable React components + shadcn/ui components
- `src/app/layouts/` - Layout components (HomeLayout, AuthLayout, SidebarLayout)
- `src/session/` - Session management via Durable Objects
- `prisma/` - Database schema and migrations
- `generated/prisma/` - Auto-generated Prisma client (do not edit)
- `migrations/` - Database migration files

**Database Models:**
- User management with profile system and organization memberships
- Post and comment system for content
- WebAuthn credentials for passwordless authentication
- Organization system with invitations and memberships
- Password reset functionality

**Key Patterns:**
- Uses RequestInfo props pattern from rwsdk for server-side data
- Layout components wrap pages and handle authentication state
- Components follow shadcn/ui conventions and Tailwind styling
- Database operations use Prisma client with D1 adapter
- Session management through SessionDurableObject

**Authentication Flow:**
- Primary: WebAuthn/Passkey authentication
- Fallback: Email/password with reset functionality
- Session storage via Durable Objects

**Environment Configuration:**
- Development: Local D1 database via Wrangler
- Production: Cloudflare D1, R2, and Durable Objects
- Configuration in `wrangler.jsonc` for Cloudflare bindings

## Important Notes

- Always run `pnpm generate` after schema changes to update Prisma client
- Use `pnpm types` to verify TypeScript compliance before commits
- Follow established patterns in existing components for consistency
- Database migrations must be created via `pnpm migrate:new`
- The project uses Cursor rules for development workflow and Task Master for project management

## Additional information about the project
Make sure you read through the .ai-guidelines.md file at the start of every task. This file contains important information about the project and the rules that must be followed and other project specific information.

Make sure you read through the .ai-code-info folder at the start of every task. This folder contains important information about the project and the rules that must be followed and other project specific information. It is a collection of files and folders that contain information about the project and the rules that must be followed and other project specific information. It is not optional to read through this folder at the start of every task.