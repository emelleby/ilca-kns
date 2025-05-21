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

## Data Flow

1. User authentication determines available capabilities
2. Content creation flows through rich editing to storage
3. Training data is captured, stored, and made available to appropriate users
4. Events are created, discovered, and managed through the calendar system
5. Administrators have oversight and control across all system aspects
