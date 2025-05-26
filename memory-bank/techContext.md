# Technical Context

## Core Technologies

As specified in the PRD:

- **RedwoodSDK**: React framework for Cloudflare providing SSR, React Server Components, and more
- **React**: Core library for building the user interface
- **Shadcn Components**: Pre-built UI components for consistent design
- **Tailwind CSS v4**: Utility-first CSS framework for styling
- **Cloudflare Workers**: Serverless execution environment
- **D1 Database**: SQL database for data storage
- **R2 Storage**: Object storage for media files
- **Cloudflare Queues**: For handling asynchronous tasks
- **Cloudflare AI**: For potential AI-enhanced features

## Development Environment

- TypeScript for type-safe development
- Mobile-first design approach
- Server-Side Rendering (SSR) for performance
- Local emulation via Miniflare

## Technical Requirements

- Page load time under 2 seconds
- 99.9% uptime target
- WCAG 2.1 AA accessibility compliance
- Data encryption in transit and at rest
- Responsive design for all screen sizes
- Cross-browser compatibility

## Database and Prisma Workflow

- Using Prisma ORM with D1 database
- Schema changes require migration and client regeneration
- `pnpm migrate:new "migration_name"` creates and applies migrations and regenerates the Prisma client
- After schema changes, restarting the dev server is necessary to use the updated Prisma client
- For manual steps:
  1. Create migration: `npm run migrate:new -- --name change_name`
  2. Apply migration: `npm run migrate:dev`
  3. Regenerate client: `npm run generate`
  4. Restart server: `npm run dev`

## Common React Hydration Errors

Hydration errors occur when the server-rendered HTML doesn't match what React would render on the client. Common causes:

1. **Browser-only APIs**: Using `window`, `document`, or `localStorage` directly in rendering
2. **Dynamic values**: Using `Date.now()` or `Math.random()` during render
3. **Browser extensions**: Extensions that modify the DOM before React hydration
4. **Locale differences**: Date or number formatting that differs between server and client

Solution pattern:

- Use a two-pass rendering approach with `isClient` state
- Create a simplified initial render for server/first client render
- Show the full interactive component only after client-side effect runs
- Use the `ClientOnly` component for reusable implementation

## Deployment Process

- Staged deployment (development, staging, production)
- Feature flags for controlled rollout
- Automated deployment pipelines
- Monitoring and alerting

## Email Service

- Using Resend API for email delivery
- Configuration via environment variables:
  - `RESEND_API_KEY`: API key for Resend service
- Email templates defined in `src/app/auth/email.ts`
- Development mode: All emails are currently sent to a development email address
- Production mode (to be implemented): Emails will be sent to the actual user's email address
- Email content is HTML-formatted with responsive design
