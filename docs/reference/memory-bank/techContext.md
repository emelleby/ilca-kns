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

## RedwoodSDK Conventions

RedwoodSDK is a React framework optimized for Cloudflare Workers that provides SSR, React Server Components, and more. Key conventions:

### Server vs Client Components

- **Default to Server Components**: Components are server-side by default unless marked with `"use client"`
- **Server Component Rules**:
  - Can perform async operations directly (database queries, API calls)
  - Cannot use browser APIs, event handlers, or hooks
  - Must wrap async components in Suspense boundaries
  - Can import and render client components
- **Client Component Rules**:
  - Mark with `"use client"` directive at the top
  - Can use hooks, browser APIs, and event handlers
  - Cannot directly import server-only code
  - Props must be serializable (no functions, dates as objects)

### Middleware and Interruptors

- **Interruptors**: RedwoodSDK's middleware system for request/response handling
- Run before route handlers to add authentication, headers, logging
- Defined in `src/interruptors.ts` or route-specific files
- Can modify request context passed to components
- Should handle errors gracefully to avoid blocking requests

### Routing System

- **File-based routing**: Pages in `src/app/pages/*` directory
- **Route definitions**: Centralized in `src/app/routes.ts`
- **Dynamic routes**: Use `[param]` syntax for dynamic segments
- **Layouts**: Can be nested, inherit from parent routes
- **Route matching**: First match wins, order matters in `routes.ts`

### Suspense and Promise Handling

- **Critical**: All async server components MUST be wrapped in Suspense
- **Hanging Promise Prevention**:
  - Avoid unnecessary async functions
  - Ensure all Promises resolve or reject
  - Don't mix server context across request boundaries
  - Use proper error boundaries
- **Hot-reload considerations**: 
  - Separate server and client logic cleanly
  - Avoid complex state initialization in mixed components

### File and Folder Layout

```
src/
├── app/
│   ├── pages/          # Route components
│   │   ├── index.tsx   # Home page
│   │   └── [slug].tsx  # Dynamic routes
│   ├── routes.ts       # Route configuration
│   └── layout.tsx      # Root layout
├── components/         # Shared components
├── lib/               # Utilities and helpers
├── interruptors.ts    # Middleware
└── worker.tsx         # Entry point
```

### Key Files

- **`worker.tsx`**: Application entry point, configures RedwoodSDK
- **`routes.ts`**: Defines URL patterns and component mappings
- **`interruptors.ts`**: Global middleware configuration
- **`layout.tsx`**: Root or nested layouts for consistent UI

### Best Practices

1. **Component Organization**:
   - Keep server and client logic separated
   - Use server components for data fetching
   - Use client components for interactivity

2. **Data Loading**:
   - Fetch data in server components
   - Pass serialized data to client components
   - Use server functions (`"use server"`) for mutations

3. **Error Handling**:
   - Wrap async components in error boundaries
   - Provide meaningful fallbacks
   - Log errors appropriately

4. **Performance**:
   - Minimize client-side JavaScript
   - Use streaming SSR for faster TTFB
   - Leverage Cloudflare's edge caching

For detailed patterns and code examples, see `redwoodSDKPatterns.md`.

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

## Cloudflare Workers Promise Handling

**CRITICAL**: Cloudflare Workers has strict limitations on Promise resolution that can cause "hanging Promise" errors.

### Common Causes of Hanging Promises

1. **Async Server Components without Suspense**: Async components not wrapped in Suspense boundaries
2. **Unnecessary Async Functions**: Functions marked as async that don't perform actual async operations
3. **I/O Context Violations**: Promises created in one request handler cannot be accessed from different request handlers
4. **Unresolved Promise Chains**: Complex Promise chains without proper resolution or error handling

### Error Symptoms

```
A hanging Promise was canceled. This happens when the worker runtime is waiting for a Promise from JavaScript to resolve, but has detected that the Promise cannot possibly ever resolve because all code and events related to the Promise's I/O context have already finished.

[vite] Internal server error: The script will never generate a response.
```

### Prevention Patterns

#### 1. Always Use Suspense for Async Server Components

```tsx
// ✅ Good - Async component wrapped in Suspense
<Suspense fallback={<div>Loading...</div>}>
  <AsyncServerComponent />
</Suspense>

// ❌ Bad - Async component without Suspense
<AsyncServerComponent />
```

#### 2. Avoid Unnecessary Async Functions

```tsx
// ❌ Bad - unnecessary async for static data
async function getStaticData() {
  return staticData;
}

// ✅ Good - synchronous for static data
function getStaticData() {
  return staticData;
}
```

#### 3. Proper Error Handling for Database Queries

```tsx
// ✅ Good - proper async with error handling
export async function DataComponent() {
  try {
    const data = await db.model.findMany();
    return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>;
  } catch (error) {
    console.error('Database error:', error);
    return <div>Failed to load data</div>;
  }
}
```

#### 4. Server Functions for Complex Operations

```tsx
// functions.ts
"use server";

export async function getComplexData() {
  return await db.model.findMany({
    include: { relations: true },
    orderBy: { createdAt: 'desc' }
  });
}

// Component.tsx
export async function Component() {
  const data = await getComplexData();
  return <div>{/* render data */}</div>;
}
```

### Monitoring for Hanging Promises

Watch for these patterns that can cause hanging promises:
- Async functions that don't actually await anything
- Missing error handling in async operations
- Complex Promise chains without proper resolution
- I/O operations that span multiple request contexts
- Server components without Suspense boundaries

### Resolution Steps

1. **Identify the async component** causing the issue
2. **Check if the async operation is necessary** - make synchronous if possible
3. **Add Suspense boundaries** around truly async components
4. **Add proper error handling** to all async operations
5. **Test thoroughly** in development environment

### Hot-Reload Specific Issues

**Client Components with Server Props**: Client components that receive server-side `RequestInfo` props can cause hanging Promise errors during hot-reload because:

- Hot-reload re-evaluates client components but server context may not be available
- JSON imports can have inconsistent timing during hot-reload vs. cold start
- Two-pass rendering patterns can cause state initialization timing issues

**Solution Pattern**: Convert to server component and extract interactive parts:

```tsx
// ❌ Problematic: Client component with server props and JSON import
"use client"
export function TasksPage(props: RequestInfo) {
  const [isClient, setIsClient] = useState(false);
  // JSON import at module level can cause hot-reload issues
  import tasksData from 'tasks/tasks.json';

  useEffect(() => setIsClient(true), []);
  // Two-pass rendering with server props
}

// ✅ Solution: Server component + separate client component
export function TasksPage(props: RequestInfo) {
  const tasks = getTasksData(); // Synchronous data loading
  return (
    <HomeLayout {...props}>
      <TasksTableClient tasks={tasks} />
    </HomeLayout>
  );
}

// Separate client component for interactivity
"use client"
export function TasksTableClient({ tasks }) {
  const [selectedTask, setSelectedTask] = useState(null);
  // Client-only state and interactions
}
```

This pattern prevents hanging Promise errors by:
- Eliminating server-client prop boundary issues
- Moving JSON imports to server component scope
- Removing two-pass rendering complexity
- Isolating client-side state to pure client components

### Additional Hot-Reload Fixes

**Layout Suspense Boundary Issues**: Wrapping entire layouts in Suspense can cause RSC hot-update errors:

```tsx
// ❌ Problematic: Suspense wrapping entire layout
const HomeLayout = ({ ctx, children }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <header>{/* server context usage */}</header>
      <main>{children}</main>
      <ClientComponent />
    </Suspense>
  );
};

// ✅ Solution: Targeted Suspense boundaries
const HomeLayout = ({ ctx, children }) => {
  return (
    <div>
      <header>{/* server context usage */}</header>
      <main>
        <ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <ClientComponent />
    </div>
  );
};
```

**JSON Import Hot-Reload Issues**: The issue was initially thought to be static JSON imports, but the real problem was using `require()` in ES modules context:

```tsx
// ❌ Problematic: Using require() in ES modules
function getTasksData() {
  try {
    const tasksData = require('tasks/tasks.json'); // ReferenceError: require is not defined
    return tasksData.tasks || [];
  } catch (error) {
    return [];
  }
}

// ✅ Solution: Static import with error handling wrapper
import tasksData from 'tasks/tasks.json';

function getTasksData() {
  try {
    return tasksData.tasks || [];
  } catch (error) {
    console.error('Failed to load tasks data:', error);
    return [];
  }
}

export function TasksPage(props) {
  const tasks = getTasksData(); // Load data with error handling
  return <TasksTableClient tasks={tasks} />;
}
```

**Key Learning**: Static imports are actually fine in server components. The hot-reload issues were primarily caused by improper Suspense boundary placement and client-server component mixing, not JSON imports.

**Error Boundary for Hot-Reload Stability**: Add error boundaries to catch and recover from hot-reload errors:

```tsx
// ErrorBoundary component helps catch hot-reload issues
<ErrorBoundary>
  <Suspense fallback={<div>Loading...</div>}>
    {children}
  </Suspense>
</ErrorBoundary>
```
