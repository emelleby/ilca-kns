# Technology Stack

## Core Framework
- **RedwoodSDK (rwsdk)**: Full-stack framework for Cloudflare Workers
- **React 19**: Frontend framework with SSR and RSC support
- **TypeScript**: Primary language for type safety
- **Vite**: Build tool and dev server

## Database & Storage
- **Prisma**: ORM with D1 adapter for Cloudflare D1 (SQLite)
- **Cloudflare D1**: Serverless SQLite database
- **Cloudflare R2**: Object storage for file uploads
- **Durable Objects**: Session management via SessionDurableObject

## UI & Styling
- **Tailwind CSS v4**: Utility-first CSS framework
- **Radix UI**: Headless component library
- **Shadcn/ui**: Pre-built component system
- **Lucide React**: Icon library
- **React Hook Form**: Form management with Zod validation

## Authentication
- **WebAuthn**: Passwordless authentication with passkeys
- **@simplewebauthn**: WebAuthn implementation library

## Package Management
- **pnpm**: Package manager (required, specified in packageManager field)

## Common Commands

### Development
```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm types            # Type checking
```

### Database
```bash
pnpm migrate:dev      # Apply migrations locally
pnpm migrate:prd      # Apply migrations to production
pnpm migrate:new      # Create new migration
pnpm seed             # Run database seeding
```

### Deployment
```bash
pnpm release          # Full deployment to Cloudflare
pnpm generate         # Generate Prisma client and Wrangler types
```

### Utilities
```bash
pnpm clean            # Clean build artifacts
pnpm worker:run       # Run worker scripts locally
```