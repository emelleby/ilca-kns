# Suggested Commands - ILCA-KNS Project

## Essential Development Commands

### Setup and Installation
```bash
# Install dependencies (first time setup)
pnpm install

# Generate Prisma client and Wrangler types
pnpm generate

# Apply database migrations (local development)
pnpm migrate:dev
```

### Daily Development Workflow
```bash
# Start development server
pnpm dev

# Type checking (recommended before commits)
pnpm types

# Check types and generate (comprehensive check)
pnpm check
```

### Database Operations
```bash
# Apply migrations to local D1 database
pnpm migrate:dev

# Apply migrations to production D1 database
pnpm migrate:prd

# Create new database migration
pnpm migrate:new

# Run database seeding script
pnpm seed
```

### Build and Deployment
```bash
# Build the application
pnpm build

# Preview built application locally
pnpm preview

# Full deployment to Cloudflare Workers (production)
pnpm release

# Run worker locally for testing
pnpm worker:run
```

### Maintenance Commands
```bash
# Clean Vite cache (troubleshooting)
pnpm clean
# or specifically:
pnpm clean:vite

# Initialize development environment
pnpm dev:init
```

## Testing Commands

**Note:** This project currently uses manual testing approach. No automated test framework is configured yet.

### Manual Testing Workflow
1. `pnpm dev` - Start development server
2. Navigate to `http://localhost:5173/`
3. Test authentication flows
4. Test profile management
5. Test community features
6. Verify responsive design on mobile

## Linting and Formatting

### Current Setup
- **vibe-rules 0.2.31** - Code formatting and linting
- **Prettier integration** - Via vibe-rules
- **TypeScript strict mode** - Enforced via tsconfig.json

### Commands
```bash
# Install vibe-rules for cursor (done via prepare script)
pnpm prepare

# Type checking (includes linting)
pnpm types
```

## Database Management

### Local Development
```bash
# Create new migration file
pnpm migrate:new

# Apply pending migrations to local D1
pnpm migrate:dev

# Generate Prisma client after schema changes
pnpm generate

# Seed database with sample data
pnpm seed
```

### Production
```bash
# Apply migrations to production D1 database
pnpm migrate:prd

# Full deployment (includes migration and build)
pnpm release
```

## Cloudflare Workers Commands

### Via Wrangler CLI
```bash
# Deploy to Cloudflare Workers
wrangler deploy

# View logs from deployed worker
wrangler tail

# Manage D1 database
wrangler d1 list
wrangler d1 info DB

# Manage R2 bucket
wrangler r2 bucket list

# Generate TypeScript types for bindings
wrangler types
```

## Troubleshooting Commands

### Common Issues
```bash
# Clear all caches and rebuild
pnpm clean && pnpm install && pnpm generate && pnpm build

# Fix TypeScript issues
pnpm generate && pnpm types

# Reset development environment
rm -rf node_modules/.vite && pnpm dev

# Check Prisma client generation
pnpm generate
ls -la generated/prisma/
```

### Debug Database Issues
```bash
# Check database connection
wrangler d1 execute DB --local --command="SELECT 1"

# View database schema
wrangler d1 execute DB --local --command=".schema"

# Check migrations status
ls -la migrations/
```

## Environment-Specific Commands

### Linux/Ubuntu (Project runs on Linux)
```bash
# Standard Linux commands that work in this environment
ls -la          # List files with details
find . -name    # Find files by name
grep -r         # Search in files
cd              # Change directory
pwd             # Print working directory
tail -f         # Follow log files
```

## Package Manager Notes

**Important:** This project uses **pnpm** exclusively. The `packageManager` field in package.json specifies `pnpm@9.15.3`.

```bash
# Don't use npm or yarn, use pnpm
pnpm install    # ✅ Correct
npm install     # ❌ Wrong
yarn install    # ❌ Wrong
```

## Git Workflow Recommendations

```bash
# Before committing
pnpm types      # Check for TypeScript errors
pnpm build      # Ensure build works

# Commit workflow
git add .
git commit -m "feat: description"
git push

# Before deployment
pnpm check      # Full type and generation check
pnpm release    # Deploy to production
```

## Performance Monitoring

```bash
# Check bundle size after build
pnpm build
ls -lh dist/     # Check built file sizes

# Monitor worker performance
wrangler tail    # Real-time logs
```