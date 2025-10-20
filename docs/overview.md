# Dance Chives
Dance Chives is an application for the breakdancing community. 

## Purpose 
Dance Chives aims to simplify how users create, share, and manage dance events. See [README.md](../README.md) for the full description.

## Tech Stack
- **Next.js (React + TypeScript)** — frontend and server routes
- **Prisma ORM** — interacts with PostgreSQL
- **PostgreSQL** — handles authentication and user data
- **Neo4j** — manages event-relationship data (used in event creation)
- **Docker Compose** — orchestrates Postgres and Neo4j services
- **Zod** — schema validation (form and API input validation)
- **React Hook Form** — form state management and validation
- **NextAuth** — authentication and authorization with magic links (RBAC-based)


## Architecture Overview
├── src/
│ ├── app/ # Next.js App Router routes + server actions
│ ├── components/ # Reusable UI and feature components
│ │ ├── ui/ # Generic primitives: accordion, button, card, dateinput
│ │ ├── forms/ # Form components (React Hook Form + Zod)
│ │ └── providers/ # Providers/wrappers (AuthProvider)
│ ├── db/ # DB query helpers and repositories (Prisma + Neo4j queries, Neo4j driver)
│ ├── lib/ # Clients and server helpers (prisma client, auth adapters)
│ ├── hooks/ # Reusable custom hooks
│ └── types/ # Shared TypeScript types and enums
├── docker/ # docker-compose and container init scripts
├── prisma/ # Prisma schema & migrations
├── docs/ # Project docs (setup, architecture, troubleshooting)
├── public/ # Static assets
├── scripts/ # Development script and Neo4j seed file


