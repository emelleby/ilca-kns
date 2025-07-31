

# Memory Bank
- The project has a memory-bank folder that contains documentation on the project's architecture, design patterns, and key decisions. This is to help me remember important details about the project and make informed decisions. Always read the content of the Memory Bank on each new conversation.
- User prefers to discuss and agree upon technical implementation architecture before each development step, and wants to be asked for acceptance before implementing new functionality.
- User prefers to avoid user serialization patterns when they were implemented as workarounds rather than proper architectural solutions.
- User prefers incremental development with 'easy does it' approach, avoiding hard-to-debug mistakes, and wants to use shadcn tables with dialog components for organization management UI.
- User prefers tables placed below action cards spanning full container width, dialog forms with name and description fields, and individual icon buttons for table actions rather than dropdowns or grouped buttons.
- User prefers factoring out interactive parts (like dialogs) as separate client components rather than converting entire pages to client components, maintaining server component benefits where possible.
- User is considering theming implementation and is uncertain whether next-themes is the right solution, wants to evaluate theming approaches for the project.
- In HTML/React, <p> elements cannot be nested inside other <p> elements as this causes hydration errors - avoid nested paragraph tags in component structure.
- User prefers to focus on getting the UI implementation right first and debug Cloudflare Workers issues later rather than getting blocked by technical issues.

# React Server Components
- For React Server Components, prefer pattern where client components fetch their own data rather than passing complex objects from server - use separate data fetching component and form component, handle form submission on server.
- For React 19 server components with RedwoodSDK, use server actions directly from client components instead of API routes - client components call server functions directly, handle success/failure based on return values, and manage their own state refresh (like window.location.reload()) without passing event handlers from server to client components.
- User prefers using React 19 server actions for form submission instead of API routes in RedwoodSDK, as they degrade gracefully and avoid the need for fetch requests and API endpoints.

# Framework Specifics
- For RedwoodSDK, use server components to fetch data and pass serialized objects to client components, avoiding complex object serialization issues by fetching on server and passing plain data.
- User prefers avoiding API routes when possible and suggests using RedwoodSDK interceptors/middleware/context patterns instead of client-side API calls for data fetching.
- Cloudflare Workers has a limitation where I/O objects (streams, request/response bodies) created in one request handler cannot be accessed from a different request's handler due to performance optimizations.
- Cloudflare Workers has strict Promise resolution limitations that cause "hanging Promise" errors when async server components aren't wrapped in Suspense boundaries or when unnecessary async functions are used for static data - always use synchronous functions for static data and wrap truly async components in Suspense.
- The PostList component hanging Promise error was resolved by converting the unnecessary async getLatestPosts() function to synchronous since it only returns static data, and comprehensive prevention patterns have been documented in the Memory Bank.
- TasksPage hanging Promise issue during hot-reload was caused by client component receiving server RequestInfo props combined with JSON imports - resolved by converting to server component with separate TasksTableClient for interactivity.
- Hot-reload RSC errors can be caused by Suspense boundaries wrapping entire layouts, static JSON imports, and client components with server props - fix by using targeted Suspense boundaries, dynamic JSON loading functions, and error boundaries.

# Authentication and Authorization
- User prefers authentication checks to be handled by 'isAuthenticated' middleware or interceptors rather than in individual API routes, and suggests using context7 for reference on proper implementation.
- The system implements RBAC (Role-Based Access Control) with organizations and requires SUPERUSER role with CRUD permissions for organization management.
- User prefers SUPERUSER functionality under /superuser route following same pattern as /user, requires authentication + SUPERUSER role check, and prefers incremental development starting with basic pages before adding functionality.
- User prefers CRUD functions to be organized by role - superuser functions should be in 'superuser' folder, admin functions in 'admin' folder, avoiding mixing different access levels. User prefers to keep admin folder separate from superuser folder, with organization CRUD functions belonging in superuser/functions.ts since SUPERUSER role handles system-level organization management while admin handles organization-level member management.
- When deleting organizations, users should retain their app membership but lose organization membership - this is the preferred pattern for organization deletion in the RBAC system.

# Notifications
- User prefers using Sonner Toaster component in the root layout for notifications instead of alert() calls.
- Toast notifications work but require setTimeout delay before page reload to be visible to users - this is a temporary workaround that needs to be replaced with real-time client->server->client updates using durable objects for better UX without page reloads.
- User prefers avoiding window.location.reload() after successful operations - toast notifications work fine without explicit page reloads and the reload is unnecessary.