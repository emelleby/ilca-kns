# RedwoodSDK Patterns Reference

This document aggregates all RedwoodSDK-specific patterns, rules, and best practices for building modern web applications with React Server Components, Cloudflare Workers, and TypeScript.

## Table of Contents

1. [React Server vs Client Components](#react-server-vs-client-components)
2. [Server Functions & Server Actions](#server-functions--server-actions)
3. [Middleware & Interruptors](#middleware--interruptors)
4. [Routing & Response Patterns](#routing--response-patterns)
5. [Cloudflare Workers Promise-handling Cheat-sheet](#cloudflare-workers-promise-handling-cheat-sheet)
6. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## React Server vs Client Components

### React Server Components (RSC)

1. **Default behavior**: All components are server components unless explicitly marked as client components
2. **Rendering**: Server components are rendered on the server as HTML and streamed to the browser
3. **Restrictions**: Cannot include client-side interactivity (state, effects, event handlers)
4. **Benefits**: Can directly fetch data and include it in the initial payload
5. **Async support**: Can be async and wrapped in Suspense boundaries

#### Server Component Example

```tsx
// Default - no directive needed
export default function MyServerComponent() {
  return <div>Hello, from the server!</div>;
}

// Async server component with data fetching
export async function TodoList({ ctx }) {
  const todos = await db.todo.findMany({ where: { userId: ctx.user.id } });

  return (
    <ol>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ol>
  );
}
```

### Client Components

1. **Explicit marking**: Must use the `"use client"` directive at the top of the file
2. **Required when component needs**:
   - Interactivity (click handlers, state management)
   - Browser APIs
   - Event listeners
   - Client-side effects
   - Client-side routing
3. **Hydration**: Will be hydrated by React in the browser

#### Client Component Example

```tsx
"use client";

export default function MyClientComponent() {
  return <button onClick={() => console.log("clicked")}>Click me</button>;
}
```

### Data Fetching in Server Components

1. **Direct fetching**: Server components can directly fetch data without useEffect
2. **Loading states**: Use Suspense boundaries to handle loading states for async server components
3. **Context passing**: Pass context (ctx) through props to child components that need it

```tsx
// Parent component with Suspense
import { Suspense } from 'react';

export default function Page({ ctx }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TodoList ctx={ctx} />
    </Suspense>
  );
}
```

---

## Server Functions & Server Actions

### Server Functions

1. **Marking**: Must use the `"use server"` directive at the top of the file
2. **Usage**: Can be imported and used in client components
3. **Execution**: Execute on the server when called from client components
4. **Context access**: Have access to the request context via `requestInfo.ctx`
5. **Use cases**: Handle form submissions and other server-side operations

#### Server Function Example

```tsx
"use server";

import { requestInfo } from "rwsdk/worker";

export async function addTodo(formData: FormData) {
  const { ctx } = requestInfo;
  const title = formData.get("title");
  await db.todo.create({ data: { title, userId: ctx.user.id } });
}

// Using in a client component
"use client";
import { addTodo } from "./actions";

export function TodoForm() {
  return (
    <form action={addTodo}>
      <input name="title" />
      <button type="submit">Add Todo</button>
    </form>
  );
}
```

### Context Usage

1. **Availability**: Context is available to all server components and server functions
2. **Access patterns**:
   - Server functions: `import { requestInfo } from "rwsdk/worker"; const { ctx } = requestInfo;`
   - Server components: Passed as props
3. **Population**: Context is populated by middleware and interruptors and is request-scoped

---

## Middleware & Interruptors

### What is Middleware?

Middleware functions run on every request before your route handlers. They can:

- Add security headers
- Handle CORS
- Implement caching strategies
- Add request/response logging
- Transform request/response data
- Implement rate limiting
- Add performance monitoring
- Handle error boundaries
- Setup sessions
- Authenticate users

### Basic Middleware Structure

```tsx
export default defineApp([
  setCommonHeaders(),
  async ({ ctx, request, headers }) => {
    await setupDb(env);
    setupSessionStore(env);
    
    try {
      // Grab the session's data
      ctx.session = await sessions.load(request);
    } catch (error) {
      if (error instanceof ErrorResponse && error.code === 401) {
        await sessions.remove(request, headers);
        headers.set("Location", "/user/login");

        return new Response(null, {
          status: 302,
          headers,
        });
      }
      throw error;
    }

    // Populate the ctx with the user's data
    if (ctx.session?.userId) {
      ctx.user = await db.user.findUnique({
        where: { id: ctx.session.userId },
      });
    }
  },
  // Route handlers follow...
]);
```

### What are Interruptors?

Interruptors are middleware functions that run before specific route handlers. They can:

- Validate user authentication and authorization
- Transform request data
- Validate inputs
- Rate limit requests
- Log activity
- Redirect users based on conditions
- Short-circuit request handling with early responses

### Interruptor Templates

#### Basic Interruptor Structure

```tsx
async function myInterruptor({ request, params, ctx }) {
  // Perform checks or transformations here
  
  // Return modified context to pass to the next interruptor or handler
  ctx.someAddedData = "value";
  
  // OR return a Response to short-circuit the request
  // return new Response('Unauthorized', { status: 401 });
}
```

#### Authentication Interruptors

```tsx
export async function requireAuth({ request, ctx }) {
  if (!ctx.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/user/login" },
    });
  }
}

export async function requireAdmin({ request, ctx }) {
  if (!ctx?.user?.isAdmin) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/user/login" },
    });
  }
}
```

#### Input Validation Interruptor

```tsx
import { z } from "zod";

// Create a reusable validator interruptor
export function validateInput(schema) {
  return async function validateInputInterruptor({ request, ctx }) {
    try {
      const data = await request.json();
      const validated = (ctx.data = schema.parse(data));
    } catch (error) {
      return Response.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
  };
}

// Usage example with a Zod schema
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).optional(),
});

export const validateUser = validateInput(userSchema);
```

#### Logging Interruptor

```tsx
export async function logRequests({ request, ctx }) {
  const start = Date.now();

  // Add a function to the context that will log when called
  ctx.logCompletion = (response) => {
    const duration = Date.now() - start;
    const status = response.status;
    console.log(
      `${request.method} ${request.url} - ${status} (${duration}ms)`,
    );
  };
}
```

#### Role-Based Access Control

```tsx
// Create a function that generates role-based interruptors
export function hasRole(allowedRoles) {
  return async function hasRoleInterruptor({ request, ctx }) {
    const session = await getSession(request);

    if (!session) {
      return Response.redirect("/login");
    }

    if (!allowedRoles.includes(session.role)) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    return { ...ctx, session };
  };
}

// Create specific role-based interruptors
export const isAdmin = hasRole(["ADMIN"]);
export const isEditor = hasRole(["ADMIN", "EDITOR"]);
export const isUser = hasRole(["ADMIN", "EDITOR", "USER"]);
```

#### Composing Multiple Interruptors

```tsx
import { route } from "rwsdk/router";
import {
  requireAuth,
  validateUser,
  apiRateLimit,
  logRequests,
} from "@/app/interruptors";

// Combine multiple interruptors
route("/api/users", [
  logRequests,     // Log all requests
  requireAuth,     // Ensure user is authenticated
  validateUser,    // Validate user input
  async ({ request, ctx }) => {
    // Handler receives validated data and session from interruptors
    const newUser = await db.user.create({
      data: {
        /* ... */
        createdBy: ctx.user.userId,
      },
    });

    return Response.json(newUser, { status: 201 });
  },
]);
```

### Organization Pattern

Create a centralized interruptors file at `./src/app/interruptors.ts`:

```tsx
import { getSession } from "rwsdk/auth";

// Authentication interruptors
export async function requireAuth({ request, ctx }) {
  const session = await getSession(request);

  if (!session) {
    return Response.redirect("/login");
  }

  return { ...ctx, session };
}

// Role-based interruptors
export function hasRole(allowedRoles) {
  return async function hasRoleInterruptor({ request, ctx }) {
    const session = await getSession(request);

    if (!session) {
      return Response.redirect("/login");
    }

    if (!allowedRoles.includes(session.role)) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    return { ...ctx, session };
  };
}

export const isAdmin = hasRole(["ADMIN"]);
export const isEditor = hasRole(["ADMIN", "EDITOR"]);

// Other common interruptors
export async function logRequests({ request, ctx }) {
  console.log(`${request.method} ${request.url}`);
  return ctx;
}
```

---

## Routing & Response Patterns

### Basic Routing

Routes are matched in the order they are defined. Define routes using the `route` function. Trailing slashes are optional and normalized internally.

#### Static Path Matching

```tsx
// Match exact pathnames
route("/", function handler() {
  return <>Home Page</>
})

route("/about", function handler() {
  return <>About Page</>
})

route("/contact", function handler() {
  return <>Contact Page</>
})
```

#### Dynamic Path Parameters

```tsx
// Match dynamic segments marked with a colon (:)
route("/users/:id", function handler({ params }) {
  // params.id contains the value from the URL
  return <>User profile for {params.id}</>
})

route("/posts/:postId/comments/:commentId", function handler({ params }) {
  // Access multiple parameters
  return <>Comment {params.commentId} on Post {params.postId}</>
})
```

#### Wildcard Path Matching

```tsx
// Match all remaining segments after the prefix
route("/files/*", function handler({ params }) {
  // params.$0 contains the wildcard value
  return <>File: {params.$0}</>
})

route("/docs/*/version/*", function handler({ params }) {
  // Multiple wildcards available as params.$0, params.$1, etc.
  return <>Document: {params.$0}, Version: {params.$1}</>
})
```

### Response Types

#### Plain Text Response

```tsx
import { route } from "rwsdk/router";

route("/api/status", function handler() {
  return new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" }
  })
})
```

#### JSON Response

```tsx
route("/api/users/:id", function handler({ params }) {
  const userData = { 
    id: params.id, 
    name: "John Doe", 
    email: "john@example.com" 
  }

  return Response.json(userData, {
    status: 200,
    headers: {
      "Cache-Control": "max-age=60"
    }
  })
})
```

#### JSX/React Components Response

```tsx
import { route } from "rwsdk/router";
import { UserProfile } from '@/app/components/UserProfile'

route("/users/:id", function handler({ params }) {
  return <UserProfile userId={params.id} />
})
```

#### Custom Document Template

```tsx
import { render, route } from "rwsdk/router";
import { Document } from '@/app/Document'

render(Document, [
  route("/", function handler() {
    return <>Home Page</>
  }),
  route("/about", function handler() {
    return <>About Page</>
  })
])
```

### Error Handling

```tsx
route("/api/posts/:id", async function handler({ params }) {
  try {
    const post = await db.post.findUnique({ where: { id: params.id } })

    if (!post) {
      return Response.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    return Response.json(post)
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to retrieve post" },
      { status: 500 }
    )
  }
})
```

### Organization with Co-located Routes

Create a file at `./src/app/pages/blog/routes.ts`:

```tsx
import { route } from "rwsdk/router";
import { isAdminUser } from '@/app/interceptors'

import { BlogLandingPage } from './BlogLandingPage'
import { BlogPostPage } from './BlogPostPage'
import { BlogAdminPage } from './BlogAdminPage'

export const routes = [
  route('/', BlogLandingPage),
  route('/post/:postId', BlogPostPage),
  route('/post/:postId/edit', [isAdminUser, BlogAdminPage])
]
```

Then import these routes in your main worker file:

```tsx
// src/worker.tsx
import { defineApp, render, route, prefix } from "rwsdk/router";
import { Document } from '@/app/Document'
import { HomePage } from '@/app/pages/home/HomePage'
import { routes as blogRoutes } from '@/app/pages/blog/routes'

export default defineApp([
  /* middleware */
  render(Document, [
    route('/', HomePage),
    prefix('/blog', blogRoutes)
  ]),
])
```

### Advanced: Route with Query Parameters

```tsx
route("/api/search", function handler({ request }) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q') || ''
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '10')

  return Response.json({
    query,
    page,
    limit,
    results: [] // Your search results would go here
  })
})
```

---

## Cloudflare Workers Promise-handling Cheat-sheet

### Key Principles

1. **Use Web APIs**: Prefer Web APIs over external dependencies (e.g., use `fetch` instead of Axios, use WebSockets API instead of node-ws)
2. **Async/Await**: Cloudflare Workers fully support async/await patterns
3. **Response Streaming**: Leverage streaming for better performance with large responses
4. **Error Boundaries**: Always wrap async operations in try-catch blocks

### Common Patterns

#### Async Route Handlers

```tsx
route("/api/data", async function handler({ request, ctx }) {
  try {
    // All database operations are promises
    const data = await db.collection.findMany();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
})
```

#### Parallel Promise Execution

```tsx
route("/api/dashboard", async function handler({ ctx }) {
  try {
    // Execute multiple promises in parallel
    const [users, posts, comments] = await Promise.all([
      db.user.count(),
      db.post.findMany({ take: 10 }),
      db.comment.findMany({ take: 10 })
    ]);

    return Response.json({ users, posts, comments });
  } catch (error) {
    return Response.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
})
```

#### Promise with Timeout

```tsx
async function fetchWithTimeout(url: string, timeout: number = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
```

#### Streaming Responses

```tsx
route("/api/stream", async function handler() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`Data chunk ${i}\n`));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
})
```

---

## Common Pitfalls & Solutions

### 1. Mixing Server and Client Code

**Pitfall**: Trying to use browser APIs in server components or server-only code in client components.

**Solution**:
```tsx
// ❌ Wrong - Using browser API in server component
export default function ServerComponent() {
  const width = window.innerWidth; // Error!
  return <div>Width: {width}</div>;
}

// ✅ Correct - Use client component for browser APIs
"use client";
export default function ClientComponent() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);
  return <div>Width: {width}</div>;
}
```

### 2. Forgetting Directives

**Pitfall**: Forgetting to add `"use client"` or `"use server"` directives.

**Solution**:
```tsx
// ❌ Wrong - Missing directive for interactive component
export default function Button() {
  return <button onClick={() => alert('Clicked')}>Click me</button>;
}

// ✅ Correct - Add "use client" for interactivity
"use client";
export default function Button() {
  return <button onClick={() => alert('Clicked')}>Click me</button>;
}
```

### 3. Context Access Confusion

**Pitfall**: Trying to access context incorrectly in different component types.

**Solution**:
```tsx
// ✅ Server Function - Use requestInfo
"use server";
import { requestInfo } from "rwsdk/worker";

export async function serverAction() {
  const { ctx } = requestInfo;
  // Use ctx here
}

// ✅ Server Component - Receive via props
export async function ServerComponent({ ctx }) {
  // Use ctx here
}

// ✅ Route Handler - Receive in handler params
route("/api/data", async function handler({ ctx }) {
  // Use ctx here
})
```

### 4. Improper Error Handling

**Pitfall**: Not handling errors in async operations properly.

**Solution**:
```tsx
// ❌ Wrong - No error handling
route("/api/user", async function handler({ params }) {
  const user = await db.user.findUnique({ where: { id: params.id } });
  return Response.json(user);
})

// ✅ Correct - Proper error handling
route("/api/user", async function handler({ params }) {
  try {
    const user = await db.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json(user);
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
})
```

### 5. Middleware Order Issues

**Pitfall**: Placing middleware in the wrong order, causing authentication checks to be bypassed.

**Solution**:
```tsx
// ❌ Wrong - Auth check after route handler
export default defineApp([
  render(Document, routes),
  authMiddleware(), // Too late!
])

// ✅ Correct - Auth middleware before routes
export default defineApp([
  authMiddleware(), // Runs first
  render(Document, routes),
])
```

### 6. Blocking in Middleware

**Pitfall**: Forgetting to return early in middleware when redirecting.

**Solution**:
```tsx
// ❌ Wrong - Continues execution after redirect
async function authMiddleware({ ctx, request, headers }) {
  if (!ctx.user) {
    headers.set("Location", "/login");
    new Response(null, { status: 302, headers }); // Missing return!
  }
  // Code continues to execute!
}

// ✅ Correct - Return early on redirect
async function authMiddleware({ ctx, request, headers }) {
  if (!ctx.user) {
    headers.set("Location", "/login");
    return new Response(null, { status: 302, headers });
  }
}
```

### 7. Inefficient Data Fetching

**Pitfall**: Making sequential database calls instead of parallel ones.

**Solution**:
```tsx
// ❌ Wrong - Sequential calls
const user = await db.user.findUnique({ where: { id } });
const posts = await db.post.findMany({ where: { userId: id } });
const comments = await db.comment.findMany({ where: { userId: id } });

// ✅ Correct - Parallel calls
const [user, posts, comments] = await Promise.all([
  db.user.findUnique({ where: { id } }),
  db.post.findMany({ where: { userId: id } }),
  db.comment.findMany({ where: { userId: id } })
]);
```

### 8. Missing Response Headers

**Pitfall**: Forgetting to set appropriate response headers.

**Solution**:
```tsx
// ❌ Wrong - Missing content type
return new Response(JSON.stringify(data));

// ✅ Correct - Use Response.json() or set headers
return Response.json(data, {
  headers: {
    "Cache-Control": "max-age=3600",
    "X-Content-Type-Options": "nosniff"
  }
});
```

---

## Best Practices Summary

1. **Components**: Keep server components as the default choice unless client-side interactivity is needed
2. **Client Code**: Use client components only when necessary to minimize JavaScript bundle size
3. **Data Fetching**: Leverage server components for data fetching and initial rendering
4. **Suspense**: Use Suspense boundaries appropriately for loading states
5. **Size**: Keep client components as small as possible, moving server-side logic to server components or server functions
6. **Directives**: Always mark client components with `"use client"` and server functions with `"use server"`
7. **Middleware**: Create focused, single-responsibility middleware and interruptors
8. **Organization**: Co-locate related routes and interruptors for better maintainability
9. **Error Handling**: Always include proper error handling and user feedback
10. **Performance**: Use parallel promise execution and streaming where appropriate
