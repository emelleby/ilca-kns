# Active Context

## Current Focus

- Implementing authentication with dual methods (passkey and email/password)
- Developing user account management functionality
- Establishing database schema and migration workflows

## Recent Changes

- Added email and password fields to User model in schema.prisma
- Implemented password-based authentication alongside passkey authentication
- Established Prisma migration workflow for schema changes
- Created utility functions for password hashing and verification

## Key Patterns and Preferences

- Mobile-first design approach
- Role-based access control
- Rich content creation capabilities
- Training progress tracking
- Event management functionality
- Interactive client components require "use client"; directive
- Two-pass rendering pattern implemented for client-side interactivity to prevent hydration errors
- Dual authentication methods (passkey-first with email/password as alternative)
- Prisma workflow: `pnpm migrate:new "migration_name"` for schema changes, followed by server restart

## Active Decisions

- Using a linked account approach for authentication methods
- Emphasizing passkey authentication in the UI while providing email/password as an alternative
- Implementing account settings to allow users to add authentication methods
- Using Prisma ORM for database operations with D1 database

## Next Steps

- Complete account linking functionality
- Implement user profile management
- Develop the personal sailing diary functionality
- Build the community blog/news system
