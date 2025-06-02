# Active Context

## Current Focus

- ✅ **Completed Task 4: User Profile Management**
- ✅ Built comprehensive profile creation, editing, and viewing functionality
- ✅ Integrated sailing-specific features (experience, certifications, boat information)
- ✅ Implemented password reset functionality
- ✅ **Resolved Cloudflare Workers compatibility issues**
- Ready to move to next phase: Activity tracking and community features

## Recent Changes

- Enhanced Profile model with sailing-specific fields (sailingExperience, certifications, boatInformation, clubAffiliation)
- Created comprehensive profile management system with functions for CRUD operations
- Built ProfileSetup component for new user onboarding
- Implemented ProfileView component for displaying user profiles with privacy controls
- Created ProfileEdit component for updating profile information
- Added profile routes to user routing system
- Updated navigation to include profile links
- Created missing UI components (Select, Checkbox, Textarea) for profile forms
- **Implemented auto-profile creation system:**
  - Profiles are automatically created during user registration (both passkey and password)
  - Profiles are auto-created when users access their profile page if none exists
  - Uses available user information (username, email, club) to populate initial profile
  - Eliminates "no profile found" scenarios for better UX
- Implemented password reset functionality with email notifications
- Set up email sending via Resend API (currently configured for development only)
- **Resolved Cloudflare Workers I/O issues:**
  - Fixed "Only plain objects can be passed to Client Components" errors
  - Implemented proper server-client data flow patterns
  - Created API endpoint approach for client-server communication
  - Established RedwoodSDK best practices for data fetching and component architecture

## Key Patterns and Preferences

- Mobile-first design approach
- Role-based access control
- Rich content creation capabilities
- Training progress tracking
- Event management functionality
- Interactive client components require "use client"; directive
- Two-pass rendering pattern implemented for client-side interactivity to prevent hydration errors
- Dual authentication methods (passkey-first with email/password as alternative)
- Prisma workflow: `pnpm migrate:new "migration_name"` for schema changes, followed by server restart
- Email notifications for account-related actions (currently in development mode)
- **RedwoodSDK Data Flow Pattern:**
  - Server components fetch data and serialize for client components
  - Client components handle UI interactions and call API endpoints
  - API routes handle HTTP requests and call server functions
  - Server functions handle database operations (marked with "use server")
  - Use API endpoints instead of direct server function calls from client components for Cloudflare Workers compatibility

## Active Decisions

- Using a linked account approach for authentication methods
- Emphasizing passkey authentication in the UI while providing email/password as an alternative
- Implementing account settings to allow users to add authentication methods
- Using Prisma ORM for database operations with D1 database
- Using Resend API for email delivery
- Development mode for emails: redirecting all emails to a development email address

## Next Steps

- Implement profile picture upload with R2 Storage integration
- Add profile deletion and account management functionality
- Create profile completion prompts for new users
- Develop the personal sailing diary functionality
- Build the community blog/news system
- Add activity statistics display to profiles
