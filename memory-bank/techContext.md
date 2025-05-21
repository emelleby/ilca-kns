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

## Deployment Process
- Staged deployment (development, staging, production)
- Feature flags for controlled rollout
- Automated deployment pipelines
- Monitoring and alerting