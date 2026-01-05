# Overview

This is a React single-page application that implements a 5-step survey flow for career/employer preference assessment. Users select professional roles (Business/Commerce/Management, Finance/Banking, Law), rank their preferences, recognize companies from those industries, compare companies pairwise, and receive a final ranking. The application is frontend-focused with hardcoded data and no real database persistence required.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks (`useState`, custom `useSurvey` hook) for local state; no global state library
- **Styling**: Tailwind CSS with custom CSS variables for theming, shadcn/ui component library (New York style)
- **Animations**: Framer Motion for drag-and-drop reordering and step transitions
- **Typography**: DM Sans for headings, Inter for body text

## Survey Flow Design
The 5-step survey progression:
1. Role Selection - Choose from 3 professional categories
2. Role Ordering - Drag-and-drop to prioritize selected roles
3. Company Recognition - Select known companies from a random pool of 20
4. Pairwise Preference - Compare companies head-to-head
5. Final Ranking - Display sorted results based on pairwise comparisons

## Backend Architecture
- **Server**: Express.js with minimal API (health check endpoint only)
- **Purpose**: Serves static files in production; Vite dev server middleware in development
- **Data Storage**: In-memory storage class (`MemStorage`) for potential future user data; currently unused since survey logic is frontend-only

## Build System
- **Development**: Vite with HMR, tsx for TypeScript execution
- **Production**: esbuild bundles server code, Vite builds client to `dist/public`
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

# External Dependencies

## UI Component Library
- **shadcn/ui**: Pre-built accessible components using Radix UI primitives
- **Radix UI**: Headless UI primitives for dialogs, dropdowns, tooltips, etc.
- **Lucide React**: Icon library

## Database (Configured but Not Required)
- **Drizzle ORM**: Schema defined in `shared/schema.ts` using PostgreSQL dialect
- **PostgreSQL**: Connection configured via `DATABASE_URL` environment variable
- **Note**: The survey app is frontend-only; database schema exists for potential future persistence but is not actively used

## Animation & Interaction
- **Framer Motion**: Animation library for transitions and drag-and-drop
- **Embla Carousel**: Carousel component for potential image galleries

## Data Fetching
- **TanStack React Query**: Configured but minimally used since data is hardcoded
- **Zod**: Schema validation for type safety

## Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator