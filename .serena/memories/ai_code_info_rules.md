# AI Code Info Rules for ILCA-KNS Project

## Overview
This document captures the comprehensive rules and guidelines defined in the `.ai-code-info/rules` directory that govern code generation, architecture patterns, and best practices for this RedwoodSDK project.

## Memory Bank System

### Memory Bank Structure
The project follows a structured memory bank approach with:
- **Core Files**: `projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`
- **Additional Context**: Feature documentation, API docs, testing strategies, deployment procedures
- **Memory Location**: `/docs/reference/memory-bank`

### Key Memory Bank Principle
> "After each reset, I rely ENTIRELY on my Memory Bank to understand the project and continue work effectively. I MUST read ALL memory bank files at the start of EVERY task - this is not optional."

## RedwoodSDK Rules

### 1. Cron Triggers (`rwsdk_rwsdk-cron.mdc`)
- **Scope**: `src/app/**/*.ts`, `src/app/**/*.tsx`, `src/worker.ts`, `src/worker.tsx`
- **Guidelines**: Use Cloudflare Cron Triggers for scheduling recurring tasks
- **Key Patterns**:
  - Switch-based cron handler by schedule expression
  - Organized handlers in `src/lib/cron/`
  - Error handling for scheduled tasks
  - Task implementations for cleanup, reports, maintenance

### 2. Database Operations (`rwsdk_rwsdk-database.mdc`)
- **Scope**: `src/app/**/*.ts`, `src/app/**/*.tsx`, `prisma/schema.prisma`, `src/lib/db.ts`
- **Guidelines**: Use Prisma Client with D1 adapter for database operations
- **Key Patterns**:
  - Centralized database client in `src/lib/db.ts`
  - Proper error handling with Prisma error codes
  - Transactions for atomic operations
  - Pagination and filtering patterns
  - Schema best practices with indexes

### 3. Environment Variables (`rwsdk_rwsdk-env.mdc`)
- **Scope**: `src/app/**/*.ts`, `src/app/**/*.tsx`, `src/worker.ts`, `src/worker.tsx`, `.env`, `worker-configuration.d.ts`
- **Guidelines**: Store sensitive information in environment variables, never hardcode secrets
- **Key Patterns**:
  - Environment variable validation at startup
  - Helper functions for type conversion and validation
  - Environment-specific configurations
  - Feature flags through environment variables

### 4. Interruptors (`rwsdk_rwsdk-interruptors.md`)
- **Scope**: `worker.tsx`, `src/app/**/routes.ts`, `src/app/**/*/routes.ts`
- **Guidelines**: Create focused, single-responsibility interruptors (middleware functions)
- **Key Patterns**:
  - Authentication and authorization interruptors
  - Input validation with Zod schemas
  - Role-based access control
  - Composable interruptor chains

### 5. Middleware (`rwsdk_rwsdk-middleware.md`)
- **Scope**: `worker.tsx`, `middleware.ts`, `middleware.tsx`
- **Guidelines**: Create focused middleware functions that run on every request
- **Key Patterns**:
  - Security headers middleware
  - CORS handling
  - Session management
  - Request/response logging

### 6. Queue Operations (`rwsdk_rwsdk-queues.mdc`)
- **Scope**: `src/app/**/*.ts`, `src/app/**/*.tsx`, `src/worker.ts`, `src/worker.tsx`, `src/lib/queue.ts`
- **Guidelines**: Use Cloudflare Queues for handling asynchronous tasks
- **Key Patterns**:
  - Centralized queue service with typed messages
  - Large payload handling with R2 storage
  - Retry logic and dead letter queues
  - Batch processing patterns

### 7. React & Server Components (`rwsdk_rwsdk-react.md`)
- **Scope**: `src/app/**/*/*.tsx`, `Document.tsx`
- **Guidelines**: Default to server components unless client-side interactivity is needed
- **Key Patterns**:
  - Server components for data fetching
  - Client components with "use client" directive
  - Server functions with "use server" directive
  - Context usage via `requestInfo`

### 8. Realtime Features (`rwsdk_rwsdk-realtime.mdc`)
- **Scope**: `src/app/**/*.ts`, `src/app/**/*.tsx`, `src/worker.ts`, `src/client.tsx`
- **Guidelines**: Use WebSockets and Durable Objects for realtime updates
- **Key Patterns**:
  - Three-component setup: client, durable object, worker route
  - Realtime client initialization with scoped keys
  - Collaborative document editing patterns
  - Real-time notifications and chat

### 9. Request/Response Handling (`rwsdk_rwsdk-request-response.md`)
- **Scope**: `worker.tsx`, `src/app/**/routes.ts`, `src/app/**/*/routes.ts`
- **Guidelines**: Use Web APIs, co-locate routes, structure responses consistently
- **Key Patterns**:
  - Static, dynamic, and wildcard path matching
  - JSON, JSX, and custom responses
  - Error handling with appropriate status codes
  - Route organization with `prefix` function

### 10. Security Headers (`rwsdk_rwsdk-security.mdc`)
- **Scope**: `src/app/**/*.ts`, `src/app/**/*.tsx`, `src/app/headers.ts`, `src/worker.ts`, `src/worker.tsx`
- **Guidelines**: Implement comprehensive security headers to protect against web vulnerabilities
- **Key Patterns**:
  - Content Security Policy (CSP) with nonces
  - Permissions Policy configuration
  - CSRF protection with token validation
  - Secure cookie handling
  - XSS protection utilities

### 11. Storage Operations (`rwsdk_rwsdk-storage.mdc`)
- **Scope**: `src/app/**/*.ts`, `src/app/**/*.tsx`, `src/worker.tsx`, `src/lib/storage.ts`
- **Guidelines**: Use streaming for file operations, implement proper error handling
- **Key Patterns**:
  - Centralized StorageClient class
  - File upload/download/delete handlers
  - File validation and metadata handling
  - React components for file operations
  - Image processing with Cloudflare features

## ILCA-KNS Project Application

These rules are particularly relevant for the sailing community platform:

### Storage Use Cases
- Event photo uploads for race documentation
- Document storage for sailing instructions and notices
- Member profile images and club assets
- Results files and race data attachments

### Queue Use Cases
- Email notifications for race updates
- Background processing of race results
- Newsletter distribution
- Event reminders and alerts

### Realtime Use Cases
- Live race tracking and updates
- Real-time scoring and leaderboards
- Chat during events and club activities
- Notifications for race changes

### Security Considerations
- Member data protection
- Role-based access (sailors, officials, admins)
- Secure file handling for sensitive documents
- CSRF protection for form submissions

## Rule Maintenance

### Self-Improvement Process
- Monitor for new patterns not covered by existing rules
- Add rules when patterns appear in 3+ files
- Update examples with actual codebase implementations
- Cross-reference related rules for consistency
- Follow `rules.md` formatting guidelines

### Integration with Memory Bank
- Rules complement the memory bank system
- Both systems work together for comprehensive code generation
- Memory bank provides project context, rules provide implementation patterns
- Regular updates needed as project evolves