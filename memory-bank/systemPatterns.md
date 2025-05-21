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
- **Role-Based Access Control**: Different capabilities based on user role
- **Rich Content Editing**: Supporting text, media, and embedded content
- **Mobile-First Design**: Optimized for mobile with responsive layouts
- **Progressive Enhancement**: Core functionality works on all devices with enhanced experiences on capable devices

## Data Flow
1. User authentication determines available capabilities
2. Content creation flows through rich editing to storage
3. Training data is captured, stored, and made available to appropriate users
4. Events are created, discovered, and managed through the calendar system
5. Administrators have oversight and control across all system aspects