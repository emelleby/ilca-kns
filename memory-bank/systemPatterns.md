# System Patterns

## Architecture Overview

The sailing community application follows a modern web architecture using RedwoodSDK on Cloudflare, with React for UI components and server-side rendering.

## Key Components

- **Authentication System**: Role-based access control with three distinct user types
- **Content Management**: Blog/news functionality with rich media support
- **Personal Data Storage**: Training logs, sailing diaries, and boat configurations
- **Event System**: Calendar and event management functionality
- **Admin Dashboard**: Comprehensive tools for system administration

## Design Patterns

- **Server Components**: UI components rendered on the server for performance
- **Client Components**: Interactive UI components requiring the "use client"; directive.
- **Role-Based Access Control**: Different capabilities based on user role
- **Rich Content Editing**: Supporting text, media, and embedded content
- **Mobile-First Design**: Optimized for mobile with responsive layouts
- **Progressive Enhancement**: Core functionality works on all devices with enhanced experiences on capable devices
- **Two-pass Rendering**: Technique used for client components with complex interactivity or potential external DOM interference during hydration, rendering a simplified version initially and the full interactive version on the client after mounting.

## Hydration Error Prevention Pattern

Client components that use browser-specific APIs or have dynamic content that might differ between server and client renders should implement the two-pass rendering pattern to prevent hydration errors:

```tsx
"use client"

import { useState, useEffect } from "react"

export function MyComponent() {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	if (!isClient) {
		return (
			// Simple skeleton or placeholder that matches the structure
			// but doesn't use any client-side APIs
			<div>Loading...</div>
		)
	}

	return (
		// Full component with client-side functionality
		<div>
			<button onClick={() => alert("Hello")}>Click me</button>
		</div>
	)
}
```

This pattern should be applied when:

1. The component uses browser-only APIs (localStorage, window, navigator)
2. The component renders content that might be affected by browser extensions
3. The component uses dynamic values that differ between server and client (Date.now(), Math.random())
4. The component renders content based on user locale or preferences

For reusability, we've created a `ClientOnly` component that can wrap any content that should only render on the client:

```tsx
<ClientOnly fallback={<CardSkeleton />}>
	<DynamicContent />
</ClientOnly>
```

## Server Data Fetching Patterns

### RedwoodSDK Server Component Pattern

Server components fetch data and pass serialized data to client components. This prevents "Only plain objects can be passed to Client Components" errors.

```tsx
// Server Component (ProfileEditPage.tsx)
import { db } from "@/db";
import { RequestInfo } from "rwsdk/worker";
import { SimpleProfileEditForm } from "@/app/components/SimpleProfileEditForm";

export default async function ProfileEditPage({ UserId, isOwnProfile, ctx }: RequestInfo & { UserId: string; isOwnProfile: boolean }) {
  // Authentication check
  if (!ctx.user || !isOwnProfile) {
    return <div>Access Denied</div>;
  }

  // Fetch data on server
  const profile = await getOrCreateUserProfile(UserId);
  const user = await db.user.findUnique({ where: { id: UserId } });

  // Serialize complex objects for client components
  const profileData = {
    id: profile.id,
    name: profile.name,
    bio: profile.bio,
    // ... other fields
    certifications: profile.certifications || [],
    boatInformation: profile.boatInformation || {},
    privacySettings: profile.privacySettings || {}
  };

  return (
    <HomeLayout {...props}>
      <SimpleProfileEditForm
        profile={profileData}
        userId={UserId}
        username={user.username}
      />
    </HomeLayout>
  );
}
```

### Client Component with API Calls

Client components handle user interactions and call API endpoints for data updates:

```tsx
// Client Component (SimpleProfileEditForm.tsx)
"use client";

import { useState } from "react";

export function SimpleProfileEditForm({ profile, userId, username }) {
  const [formData, setFormData] = useState(profile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call API endpoint instead of server function directly
      const response = await fetch("/user/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          profileData: formData
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Profile updated successfully!");
        window.location.href = `/user/${username}/profile`;
      } else {
        alert(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### API Route Pattern

API routes handle HTTP requests and call server functions:

```tsx
// API Route (in routes.tsx)
route("/api/profile/update", async ({ request }) => {
  try {
    const { ctx } = requestInfo;

    // Authentication check
    if (!ctx.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { userId: string; profileData: any };
    const { userId, profileData } = body;

    // Authorization check
    if (ctx.user.id !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Call server function
    const result = await updateUserProfile(userId, profileData);

    if (result) {
      return Response.json({ success: true, profile: result });
    } else {
      return Response.json({ error: "Failed to update profile" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
})
```

### Server Functions Pattern

Server functions handle database operations and are marked with "use server":

```tsx
// Server Functions (functions.ts)
"use server";

import { db } from "@/db";

export async function updateUserProfile(userId: string, profileData: Partial<ProfileData>) {
  try {
    const updateData: any = {};

    // Handle simple fields
    if (profileData.name !== undefined) updateData.name = profileData.name;
    if (profileData.bio !== undefined) updateData.bio = profileData.bio;

    // Handle JSON fields - must stringify for database
    if (profileData.certifications !== undefined) {
      updateData.certifications = JSON.stringify(profileData.certifications);
    }
    if (profileData.boatInformation !== undefined) {
      updateData.boatInformation = JSON.stringify(profileData.boatInformation);
    }

    const profile = await db.profile.update({
      where: { userId },
      data: updateData,
    });

    return profile;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return null;
  }
}
```

## React 19 Server Actions Pattern (Preferred)

With React 19 and RedwoodSDK, we can use server actions directly from client components instead of API routes. This provides better performance and simpler code.

### Server Action Form Submission Pattern

```tsx
// Server Functions (functions.ts)
"use server";

import { db } from "@/db";

export async function createOrganization(name: string, description?: string) {
  try {
    const organization = await db.organization.create({
      data: { name, description },
    });
    return organization; // Return success result
  } catch (error) {
    console.error("Error creating organization:", error);
    return null; // Return failure result
  }
}
```

```tsx
// Client Component (CreateOrganizationDialog.tsx)
"use client";

import { useState } from "react";
import { createOrganization } from "./functions";

export default function CreateOrganizationDialog() {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call server function directly - no API route needed
      const result = await createOrganization(
        formData.name.trim(),
        formData.description.trim() || undefined
      );

      if (result) {
        // Handle success within client component
        setFormData({ name: "", description: "" });
        alert("Organization created successfully!");

        // Refresh page to show new data
        window.location.reload();
      } else {
        alert("Failed to create organization. Please try again.");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      alert("Failed to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

```tsx
// Server Component (Dashboard.tsx)
export default async function Dashboard(props: RequestInfo) {
  // Fetch data on server
  const organizations = await getOrganizationsForDisplay();

  return (
    <div>
      {/* Pass data to client components, but NO event handlers */}
      <CreateOrganizationDialog />
      <OrganizationsTable organizations={organizations} />
    </div>
  );
}
```

### Key Rules for React 19 Server Actions

1. **No Event Handler Passing**: Never pass functions from server to client components
2. **Client Self-Management**: Client components handle their own success/failure states
3. **Direct Server Calls**: Client components call server functions directly
4. **Return Status**: Server functions return success/failure status, not void
5. **Page Refresh**: Use `window.location.reload()` for data refresh after mutations
6. **Graceful Degradation**: Server actions work even without JavaScript

### Benefits of Server Actions vs API Routes

- ✅ **Simpler Code**: No API route boilerplate needed
- ✅ **Better Performance**: Direct function calls, no HTTP overhead
- ✅ **Type Safety**: Full TypeScript support across server/client boundary
- ✅ **Graceful Degradation**: Works without JavaScript enabled
- ✅ **Less Boilerplate**: No request/response handling needed

### Key Patterns Summary

1. **Server Components**: Fetch data, serialize objects, pass to client components
2. **Client Components**: Handle UI interactions, call server functions directly (React 19)
3. **Server Functions**: Handle database operations, return success/failure status
4. **No Event Handlers**: Never pass functions from server to client components
5. **Self-Contained Client Logic**: Client components manage their own state and refresh

## Data Flow

1. User authentication determines available capabilities
2. Server components fetch and serialize data for client components
3. Client components handle user interactions and call API endpoints
4. API routes authenticate requests and call server functions
5. Server functions perform database operations and return results
6. Content creation flows through rich editing to storage
7. Training data is captured, stored, and made available to appropriate users
8. Events are created, discovered, and managed through the calendar system
9. Administrators have oversight and control across all system aspects
