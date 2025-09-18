# ILCA-KNS Code Style Conventions

## Project Structure

### RedwoodSDK Application Layout
```
src/
├── app/                    # Application code
│   ├── pages/             # Page components and routes
│   │   ├── home/          # Home page functionality
│   │   ├── members/       # Member management
│   │   ├── clubs/         # Club management
│   │   ├── events/        # Event management
│   │   └── auth/          # Authentication pages
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Shadcn/UI components
│   │   ├── forms/         # Form components
│   │   └── layout/        # Layout components
│   ├── lib/              # Utility functions and helpers
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── db.ts          # Database client setup
│   │   ├── utils.ts       # General utilities
│   │   └── validations.ts # Form validation schemas
│   └── Document.tsx       # HTML document template
├── worker.tsx             # Main Cloudflare Worker entry
├── client.tsx             # Client-side hydration setup
prisma/
├── schema.prisma          # Database schema
└── migrations/            # Database migrations
docs/
└── reference/
    └── memory-bank/       # Project documentation
```

## React Server Components Patterns

### Server Components (Default)
```tsx
// Server components are async and run on the edge
export default async function MembersPage({ ctx }) {
  // Direct database access in server components
  const members = await ctx.db.user.findMany({
    include: {
      memberships: {
        include: { club: true }
      }
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Club Members</h1>
      <MembersList members={members} />
    </div>
  );
}
```

### Client Components (Selective Use)
```tsx
"use client";

// Only mark as client component when interactivity is needed
export default function MemberSearchForm() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (term: string) => {
    // Client-side interactivity
    const response = await fetch(`/api/members/search?q=${term}`);
    const data = await response.json();
    setResults(data.members);
  };

  return (
    <div className="search-form">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          handleSearch(e.target.value);
        }}
        className="w-full px-3 py-2 border rounded-md"
        placeholder="Search members..."
      />
      <SearchResults results={results} />
    </div>
  );
}
```

### Server Functions
```tsx
"use server";

import { requestInfo } from "rwsdk/worker";
import { revalidatePath } from "rwsdk/cache";

export async function updateMemberProfile(formData: FormData) {
  const { ctx } = requestInfo;
  
  // Validate user is authenticated
  if (!ctx.user) {
    throw new Error("Authentication required");
  }

  const name = formData.get('name') as string;
  const bio = formData.get('bio') as string;

  // Update user profile
  await ctx.db.user.update({
    where: { id: ctx.user.id },
    data: { name, bio }
  });

  // Revalidate the profile page
  revalidatePath('/profile');
}
```

## Route Organization

### Route File Structure
```tsx
// src/app/pages/members/routes.ts
import { route } from 'rwsdk/router';
import { requireAuth, requireClubMember } from '../../lib/auth';

import { MembersList } from './MembersList';
import { MemberProfile } from './MemberProfile';
import { MemberEdit } from './MemberEdit';

export default [
  // Public routes
  route('/', MembersList),
  route('/:id', MemberProfile),
  
  // Protected routes with middleware
  route('/:id/edit', [requireAuth, requireClubMember, MemberEdit]),
];
```

### Main Worker Setup
```tsx
// src/worker.tsx
import { defineApp, render, route, prefix } from "rwsdk/router";
import { Document } from './app/Document';
import { HomePage } from './app/pages/home/HomePage';

// Import route modules
import membersRoutes from './app/pages/members/routes';
import clubsRoutes from './app/pages/clubs/routes';
import eventsRoutes from './app/pages/events/routes';
import authRoutes from './app/pages/auth/routes';

export default defineApp([
  // Global middleware
  setCommonHeaders(),
  setupDatabase(),
  setupSession(),
  
  // Route definitions
  render(Document, [
    route('/', HomePage),
    prefix('/members', membersRoutes),
    prefix('/clubs', clubsRoutes),
    prefix('/events', eventsRoutes),
    prefix('/auth', authRoutes),
  ]),
]);
```

## TypeScript Conventions

### Type Definitions
```typescript
// src/app/lib/types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  memberships: ClubMembership[];
}

export interface ClubMembership {
  id: string;
  role: MembershipRole;
  status: MembershipStatus;
  club: Club;
  joinedAt: Date;
}

export interface RequestContext {
  user?: User;
  db: PrismaClient;
  session?: Session;
}

// Strict typing for server functions
export type ServerAction<T = void> = (formData: FormData) => Promise<T>;
export type AsyncComponent<P = {}> = (props: P) => Promise<JSX.Element>;
```

### Database Query Patterns
```typescript
// src/app/lib/queries.ts
export async function getUserWithMemberships(email: string) {
  return await db.user.findUnique({
    where: { email },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              shortName: true
            }
          }
        }
      }
    }
  });
}

export async function getUpcomingEvents(clubId?: string) {
  return await db.event.findMany({
    where: {
      startTime: { gte: new Date() },
      status: 'SCHEDULED',
      ...(clubId && { clubId })
    },
    include: {
      club: true,
      _count: {
        select: { signups: true }
      }
    },
    orderBy: { startTime: 'asc' },
    take: 20
  });
}
```

## Component Architecture

### Component Composition
```tsx
// Compound component pattern for complex UI
export function EventCard({ event }: { event: Event }) {
  return (
    <Card className="event-card">
      <EventCard.Header>
        <EventCard.Title>{event.title}</EventCard.Title>
        <EventCard.Club>{event.club.name}</EventCard.Club>
      </EventCard.Header>
      
      <EventCard.Content>
        <EventCard.DateTime 
          startTime={event.startTime} 
          endTime={event.endTime} 
        />
        <EventCard.Description>{event.description}</EventCard.Description>
      </EventCard.Content>
      
      <EventCard.Actions>
        <SignupButton eventId={event.id} />
        <ShareButton event={event} />
      </EventCard.Actions>
    </Card>
  );
}
```

### Form Patterns with Validation
```tsx
// src/app/components/forms/EventForm.tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  maxParticipants: z.number().min(1).optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export function EventForm({ onSubmit }: { onSubmit: ServerAction }) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  return (
    <form action={onSubmit} className="space-y-4">
      <FormField name="title" label="Event Title" required />
      <FormField name="description" label="Description" multiline />
      <DateTimeField name="startTime" label="Start Time" required />
      <DateTimeField name="endTime" label="End Time" />
      <NumberField name="maxParticipants" label="Max Participants" />
      
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Saving...' : 'Save Event'}
      </Button>
    </form>
  );
}
```

## Styling Conventions

### Tailwind CSS Patterns
```tsx
// Consistent spacing and responsive design
export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// Component-specific utility classes
export function MemberCard({ member }: { member: User }) {
  return (
    <div className="
      bg-white rounded-lg shadow-md p-6
      hover:shadow-lg transition-shadow duration-200
      border border-gray-200
    ">
      <div className="flex items-center space-x-4">
        <Avatar 
          src={member.profilePicture} 
          fallback={member.name[0]}
          className="w-12 h-12"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{member.name}</h3>
          <p className="text-sm text-gray-600">{member.email}</p>
        </div>
      </div>
    </div>
  );
}
```

### Shadcn/UI Integration
```tsx
// src/app/components/ui/button.tsx
import { cn } from '../../lib/utils';
import { buttonVariants } from './button-variants';

export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'default', 
  size = 'default', 
  className, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

## Error Handling Patterns

### Server-side Error Handling
```tsx
// Server components with error boundaries
export default async function EventsPage({ ctx }: { ctx: RequestContext }) {
  try {
    const events = await getUpcomingEvents();
    return <EventsList events={events} />;
  } catch (error) {
    console.error('Failed to load events:', error);
    return (
      <ErrorState 
        title="Unable to load events"
        message="Please try again later"
        retry={() => window.location.reload()}
      />
    );
  }
}

// Server function error handling
export async function joinEvent(formData: FormData) {
  "use server";
  
  const { ctx } = requestInfo;
  
  try {
    const eventId = formData.get('eventId') as string;
    
    // Validate user can join
    const event = await ctx.db.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { signups: true } } }
    });
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    if (event.maxParticipants && event._count.signups >= event.maxParticipants) {
      throw new Error('Event is full');
    }
    
    // Create signup
    await ctx.db.eventSignup.create({
      data: {
        eventId,
        userId: ctx.user.id,
        status: 'CONFIRMED'
      }
    });
    
    revalidatePath('/events');
    return { success: true };
  } catch (error) {
    console.error('Join event error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to join event'
    };
  }
}
```

## Performance Optimization

### Code Splitting and Lazy Loading
```tsx
// Lazy load heavy components
const EventCalendar = lazy(() => import('./EventCalendar'));
const MemberDirectory = lazy(() => import('./MemberDirectory'));

export function EventsPage() {
  return (
    <div>
      <h1>Events</h1>
      <Suspense fallback={<CalendarSkeleton />}>
        <EventCalendar />
      </Suspense>
    </div>
  );
}
```

### Database Query Optimization
```typescript
// Efficient pagination with cursor-based approach
export async function getEvents(cursor?: string, limit = 20) {
  return await db.event.findMany({
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    where: {
      startTime: { gte: new Date() },
      status: 'SCHEDULED'
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      club: { select: { name: true } },
      _count: { select: { signups: true } }
    },
    orderBy: { startTime: 'asc' }
  });
}
```

## Testing Conventions

### Component Testing
```typescript
// src/app/components/__tests__/MemberCard.test.tsx
import { render, screen } from '@testing-library/react';
import { MemberCard } from '../MemberCard';

const mockMember = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  memberships: []
};

describe('MemberCard', () => {
  it('renders member information', () => {
    render(<MemberCard member={mockMember} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

### Server Function Testing
```typescript
// src/app/lib/__tests__/auth.test.ts
import { validateUser } from '../auth';

describe('Auth utilities', () => {
  it('validates user credentials', async () => {
    const result = await validateUser('test@example.com', 'password');
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });
});
```