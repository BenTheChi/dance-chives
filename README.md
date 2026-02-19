# Dance Chives - An event archive app for the street dance community

![Screenshot 2025-06-12 at 10 45 45 AM](https://github.com/user-attachments/assets/7f373511-9834-4273-9794-5ef40750c79e)

## Problem

The street and club dance community thrives as an event-driven subculture centered around high-energy competitions known as battles. Through the collective grassroots efforts of dancers and organizers, thousands of these battles take place across the globe each year, generating extensive footage. While most events are promoted, shared, and documented on social media, platforms like Facebook, Instagram, and YouTube lack the structure to systematically organize dance events and their metadata in an accessible way. As a result, the culture remains fragmented online, leaving many talented dancers, event hosts, and creators without proper recognition.

That’s where **Dance Chives** comes in.

## Solution

**Dance Chives** is a web app archive designed to collect, display, and track dance event data. Our goal is to unify all metadata, media, and social connection through our site. Most of the data we need is sourced from Instagram and YouTube, so we are only displaying them as iFrames. We aim for **high SEO** and organic search to drive traffic. This site is highly inspired by similar sites like bboy.org and breakkonnect.com. However, we aim to focus more on the collection of videos, images, and social media posts for events.

---

## Example Event

### Massive Monkees Day 2024

- [Instagram Post](https://www.instagram.com/p/C7Hilb9xqNY/)
- [YouTube Battles from that day](https://www.youtube.com/watch?v=_9yz_EXYi3g&list=PLHV9AalJgY_IPJgrCD12zXxCMsQ-wrEsP)
- [Official Website](https://www.massivemonkees.com/massive-monkees-day)

### Event Participants

- **DJ**: [DJ Magic Sean](https://www.instagram.com/djmagicsean/)
- **MC**: [Mac Tray](https://www.instagram.com/mactrayy/)

There is an existing site called [BreakKonnect](https://breakkonnect.com/) that has similar functionality but does not emphasize video or image archiving.

---

## Project Status

**Dance Chives is currently in active development, preparing for open beta launch.**

The platform has evolved significantly with a comprehensive feature set including event management, tagging systems, user profiles, and a robust request/approval workflow. The core infrastructure is in place, and we're focusing on polish, performance, and user experience improvements before the public beta release.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for local databases)
- PostgreSQL (via Docker)
- Neo4j (via Docker or Aura account)
- Google Cloud Storage account (for image uploads)
- Google OAuth credentials (for authentication)
- Resend API key (for email/magic links)
- YouTube Data API v3 key (for playlist parsing - Super Admin feature)
- Groq API key (for LLM-powered playlist parsing - Super Admin feature)

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd dance-chives
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   - Copy `.env.example` to `.env.local`
   - Configure all required environment variables (database URLs, OAuth credentials, etc.)

4. **Start local databases**

   ```bash
   npm run docker:up
   ```

   If you previously started the old plain Postgres container, reset volumes once so the PostGIS-enabled image initializes cleanly:

   ```bash
   npm run docker:reset
   ```

5. **Run database migrations**

   ```bash
   npm run db:migrate
   ```

6. **Seed the database** (optional)

   ```bash
   npm run db:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run docker:up` - Start Docker containers (PostgreSQL + Neo4j)
- `npm run docker:down` - Stop Docker containers
- `npm run neo4j:seed` - Seed Neo4j with sample data
- `npm run lint` - Run ESLint

---

## Tech Stack

### Frontend

- **TypeScript** / **Next.js 16** / **React 19**
- **ShadCN UI** / **Radix UI** components
- **Tailwind CSS 4** for styling
- **React Hook Form** + **Zod** for form validation
- **date-fns** for date manipulation
- **Lucide React** for icons

### Backend

- **Next.js API Routes** (serverless functions)
- **NextAuth v5** for authentication
- **Neo4j** (Aura hosted) - Graph database for relationships
- **PostgreSQL** (via Prisma) - Relational database for fast queries
- **Prisma** as ORM for PostgreSQL
- **Neo4j Driver** for graph queries

### Infrastructure

- **Vercel** for hosting and deployment
- **Google Cloud Storage** for image/poster storage
- **Docker Compose** for local development (PostgreSQL + Neo4j)
- **Resend** for email delivery (magic links)

### Development Tools

- **ESLint** for code quality
- **TypeScript** for type safety
- **Turbopack** for fast development builds

---

## Current Features

### Event Management

- **Event Creation & Editing**: Full event creation workflow with support for multiple dates, timezones, and event types
- **Event Sections**: Organize events into sections (battles, showcases, workshops, etc.) with individual video collections
- **Event Dates**: Support for timed and all-day events with proper timezone handling
- **Event Status**: Visibility controls (visible, draft, archived)
- **Event Posters**: Upload and manage promotional images via Google Cloud Storage
- **Event Settings**: Comprehensive settings page for event organizers
- **Bracket View**: Display event videos in a bracketed format to watch all battles in one place

### Tagging & Requests System

- **Self-Tagging Requests**: Users can request to tag themselves in events, videos, and sections with specific roles
- **Role-Based Tagging**: Tag users as Organizers, DJs, MCs, Dancers, Winners, Judges, and more
- **Video Tagging**: Connect dancers to specific videos with role assignments
- **Section Tagging**: Tag winners and participants in event sections
- **Team Member Requests**: Request to join event teams for collaboration
- **Request Approval Workflow**: Event organizers and moderators can approve/deny tagging requests
- **Request Management Dashboard**: View and manage all incoming and outgoing requests

### User Profiles & Portfolios

- **Public Profiles**: Username-based profiles showcasing user's dance journey
- **Portfolio Sections**:
  - Events participated in (as dancer, organizer, DJ, MC, etc.)
  - Sections won (competition victories)
  - Tagged videos (videos featuring the user)
  - Roles across events
- **City & Style Associations**: Connect users to cities and dance styles
- **Contact Information**: Profile contact sections for networking

### Search & Discovery

- **Advanced Search**: Filter events by city, date range, dance styles, and event types
- **Calendar View**: Visual calendar interface with city and style filters
- **Event Browsing**: Browse events by city, style, and date
- **Style Pages**: Dedicated pages for each dance style with related events
- **City Pages**: Location-based event discovery

### Authentication & Authorization

- **Google OAuth**: Sign in with Google account
- **Magic Link Authentication**: Passwordless email-based login
- **Account Verification**: Post-OAuth account setup and verification
- **Multi-Level Authorization System**:
  - **Base User (0)**: Standard user access
  - **Creator (1)**: Can create and edit events
  - **Moderator (2)**: Can approve requests and moderate content
  - **Admin (3)**: Full administrative access
  - **Super Admin (4)**: Highest level access
- **Auth Level Change Requests**: Request system for authorization level upgrades
- **Protected Routes**: Page and API-level authentication/authorization guards

### Notifications

- **Real-Time Notifications**: In-app notification system for request updates
- **Notification Types**:
  - Incoming tagging requests
  - Request approvals/denials
  - Team member additions
  - Auth level changes
- **Notification Center**: Centralized notification management with mark-as-read functionality
- **Notification Badges**: Visual indicators for new notifications

### Video Management

- **Video Collections**: Organize videos by event sections
- **YouTube Integration**: Embed YouTube videos via iframes
- **Video Tagging**: Connect videos to dancers, roles, and events
- **Video Metadata**: Track video titles, sources, and associations

### Data Architecture

- **Hybrid Database System**:
  - **Neo4j**: Graph database for relationships (events, users, videos, tags)
  - **PostgreSQL**: Relational database for fast queries (event cards, user cards, requests, notifications)
- **Read Models**: Optimized PostgreSQL projections for fast card rendering and calendar queries
- **City & Style Management**: Comprehensive city and dance style taxonomies

### User Experience

- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Dark/Light Theme**: Theme support via next-themes
- **Dashboard**: Personalized dashboard for managing events, requests, and notifications
- **Settings Page**: User account and preference management

---

## Nice-To-Have Features

- Dance Style History: Accompanied by videos and event suggestions.
- Non-English language support.
- Monetization through ads and promoted events.
- Ongoing dance class information.
- Ongoing practice session information.
- Venue (studio) information.
- Mapping feature with a timeline displaying enhanced geographical locations of events.

---

## Open Beta Preparation

### Completed Infrastructure

✅ **Authentication System**: Google OAuth and magic link authentication fully implemented  
✅ **Authorization System**: Multi-level role-based access control (Base User → Creator → Moderator → Admin → Super Admin)  
✅ **Request System**: Complete tagging, team member, and auth level change request workflows  
✅ **Notification System**: Real-time notifications for all request types  
✅ **Event Management**: Full CRUD operations for events, sections, dates, and videos  
✅ **User Profiles**: Comprehensive portfolio system with event participation tracking  
✅ **Search & Discovery**: Advanced search with filters, calendar view, and style/city pages  
✅ **Database Architecture**: Hybrid Neo4j + PostgreSQL system with optimized read models  
✅ **Image Storage**: Google Cloud Storage integration for event posters  
✅ **Responsive UI**: Mobile-friendly design with dark/light theme support

### Known Technical Debt

- **CI/CD Pipeline**: Automated testing and deployment pipeline needed
- **Client/Server State Management**: Consider TanStack Query for better caching and synchronization
- **Testing Coverage**: Unit and integration tests needed
- **Migration Planning**: Future migration from Vercel to Google Cloud Run (if needed)

---

## Meetings

**Weekly meetings every Wednesday at 6pm PST.**

- **For designers**: Drop in to see current tickets.
- **For engineers**: You can also drop in but may need a walk-through of the code and some guidance from Ben.
- **How to join**:
  - Join the Discord and ping Ben to arrange a time to go through the code, what to learn, and what needs to be done.

👉 [Join the Discord](https://discord.gg/mk7ytfUsX8)
