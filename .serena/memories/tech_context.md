# ILCA-KNS Technical Context

## Core Technology Stack

### Framework: RedwoodSDK 0.3.9
- **Platform**: Cloudflare Workers with React Server Components
- **Architecture**: Edge-first, server-side rendering with selective client hydration
- **Constraints**: 1MB memory limit, Promise-based async patterns only
- **Performance**: Global edge distribution for low latency

### Frontend Technologies
- **React**: Version 19 with Server Components
- **TypeScript**: Strict type checking, modern ES features
- **Styling**: Tailwind CSS + Shadcn/UI component library
- **Design System**: Mobile-first responsive design
- **State Management**: Server state with React Server Components

### Backend & Database
- **Database**: Prisma ORM with Cloudflare D1 SQLite
- **Edge Database**: Global distribution with eventual consistency
- **Migrations**: Prisma migrate for schema evolution
- **Connection**: Edge-optimized connection pooling

### Authentication System
- **Primary**: WebAuthn (passwordless, biometric)
- **Fallback**: Email/Password traditional auth
- **Session Management**: Secure edge-based sessions
- **Security**: Multi-factor authentication support

### Infrastructure
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Storage**: Cloudflare R2 for file storage
- **CDN**: Cloudflare global network
- **Domain**: Custom domain with SSL/TLS

## RedwoodSDK Development Patterns

### Server Components (Default)
```tsx
// Server components run on the edge, can be async
export default async function ServerComponent({ ctx }) {
  const data = await ctx.db.user.findMany();
  return <div>{data.map(user => <UserCard key={user.id} user={user} />)}</div>;
}
```

### Client Components (Selective)
```tsx
"use client";
// Only when interactivity is needed
export default function InteractiveComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(!state)}>Toggle</button>;
}
```

### Server Functions
```tsx
"use server";
import { requestInfo } from "rwsdk/worker";

export async function serverAction(formData: FormData) {
  const { ctx } = requestInfo;
  // Server-side logic with database access
}
```

### Route Patterns
```tsx
// src/app/pages/members/routes.ts
import { route } from 'rwsdk/router';

export default [
  route('/', MembersList),
  route('/:id', MemberDetail),
  route('/:id/edit', [requireAuth, MemberEdit])
];
```

### Middleware & Interruptors
```tsx
// Authentication middleware
export async function requireAuth({ request, ctx }) {
  if (!ctx.user) {
    return Response.redirect('/login');
  }
}
```

## Database Architecture

### Prisma Schema Highlights
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  memberships   ClubMembership[]
  eventSignups  EventSignup[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Club {
  id          String @id @default(uuid())
  name        String
  description String?
  location    String?
  memberships ClubMembership[]
  events      Event[]
}

model ClubMembership {
  id       String @id @default(uuid())
  userId   String
  clubId   String
  role     MembershipRole @default(MEMBER)
  joinedAt DateTime @default(now())
  user     User @relation(fields: [userId], references: [id])
  club     Club @relation(fields: [clubId], references: [id])
  @@unique([userId, clubId])
}
```

### Edge Database Considerations
- **Eventual Consistency**: Design for distributed data
- **Connection Pooling**: Edge-optimized connections
- **Query Optimization**: Minimize round trips
- **Data Locality**: Consider geographic distribution

## Development Environment

### Local Development
```bash
# Start development server
npm run dev

# Database operations
npx prisma db push          # Push schema changes
npx prisma generate         # Generate client
npx prisma studio          # Database browser

# Cloudflare Workers
npx wrangler dev           # Local worker development
npx wrangler types         # Generate types
```

### Deployment Pipeline
```bash
# Production deployment
npm run deploy

# Database migrations
npx prisma migrate deploy

# Environment management
wrangler secret put JWT_SECRET
wrangler secret put DATABASE_URL
```

## Performance Optimization

### Edge Computing Best Practices
- **Server Components**: Reduce client JavaScript bundle
- **Streaming**: Use React Suspense for progressive loading
- **Caching**: Leverage Cloudflare cache for static assets
- **Bundle Splitting**: Code splitting for optimal loading

### Database Optimization
- **Query Efficiency**: Use Prisma select for specific fields
- **Connection Management**: Edge-aware connection pooling
- **Data Modeling**: Optimize for edge consistency patterns

### Mobile Performance
- **Touch Interfaces**: Optimized for mobile interactions
- **Responsive Design**: Mobile-first CSS patterns
- **Offline Support**: Progressive enhancement strategies
- **Load Performance**: Minimize time to interactive

## Security Considerations

### Authentication Security
- **WebAuthn**: FIDO2 standard implementation
- **Session Management**: Secure edge-based sessions
- **CSRF Protection**: Token-based protection
- **Rate Limiting**: Edge-based request limiting

### Data Security
- **Edge Encryption**: Data encrypted in transit and at rest
- **Access Control**: Role-based permissions system
- **Input Validation**: Server-side validation patterns
- **SQL Injection Prevention**: Prisma ORM protection

## Integration Patterns

### External APIs
- **HTTP Clients**: Edge-optimized fetch patterns
- **Authentication**: OAuth and API key management
- **Rate Limiting**: Client-side rate limiting
- **Error Handling**: Resilient integration patterns

### File Storage
- **Cloudflare R2**: Object storage integration
- **Upload Handling**: Streaming upload patterns
- **Image Processing**: Edge-based image optimization
- **CDN Integration**: Global content delivery

## Monitoring & Debugging

### Development Tools
- **Wrangler CLI**: Local development and debugging
- **Prisma Studio**: Database inspection
- **Browser DevTools**: Client-side debugging
- **Edge Logs**: Cloudflare Workers analytics

### Production Monitoring
- **Edge Analytics**: Request and performance metrics
- **Error Tracking**: Exception monitoring
- **Performance Monitoring**: Core web vitals tracking
- **Database Monitoring**: Query performance analysis