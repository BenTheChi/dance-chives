# Development Setup

This guide will help you set up the local development environment with Docker containers for both PostgreSQL and Neo4j databases.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- npm or yarn package manager

## Quick Start

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory with the following content:

   ```env
   # Database URLs for local Docker containers
   DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/dance_chives_dev"
   NEO4J_URI="bolt://localhost:7687"
   NEO4J_USERNAME="neo4j"
   NEO4J_PASSWORD="dev_password"

   # NextAuth Configuration
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-development-secret-key"

   # Google OAuth (required for authentication)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Development flags
   NODE_ENV="development"
   ```

3. **Start everything with one command:**

   ```bash
   npm run dev:setup
   ```

   This command will:

   - Start Docker containers (PostgreSQL + Neo4j)
   - Wait for databases to be ready
   - Run Prisma migrations and seed PostgreSQL
   - Seed Neo4j with test data
   - Start the Next.js development server

## Manual Setup

If you prefer to run commands individually:

1. **Start Docker containers:**

   ```bash
   npm run docker:up
   ```

2. **Run database migrations:**

   ```bash
   npm run db:migrate
   ```

3. **Seed databases with test data:**

   ```bash
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run docker:up` - Start Docker containers in detached mode
- `npm run docker:down` - Stop Docker containers
- `npm run docker:logs` - View Docker container logs
- `npm run docker:reset` - Reset containers and volumes (fresh start)
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed both databases with test data
- `npm run neo4j:seed` - Seed only Neo4j with test data
- `npm run dev:setup` - Complete setup and start development

## Database Access

### PostgreSQL

- **Host:** localhost:5432
- **Database:** dance_chives_dev
- **Username:** dev_user
- **Password:** dev_password
- **GUI:** Run `npm run db:studio` to open Prisma Studio

### Neo4j

- **Bolt URL:** bolt://localhost:7687
- **HTTP URL:** http://localhost:7474
- **Username:** neo4j
- **Password:** dev_password
- **Browser:** Visit http://localhost:7474 for Neo4j Browser

## Test Data

The setup includes comprehensive test data:

### PostgreSQL Test Data

- 5 test users with different auth levels (0-3)
- User-event relationships
- User-city relationships
- Auth codes for testing authorization
- OAuth account records

### Neo4j Test Data

- Cities (New York, Los Angeles, Chicago, Miami)
- Users (matching PostgreSQL users)
- Events (Summer Battle 2024, Winter Cypher 2024, Spring Jam 2024)
- Event relationships (creators, participants, judges)
- Sections, brackets, and videos
- Gallery photos and posters

## Environment Configuration

The application uses different database configurations based on the environment:

- **Development:** Local Docker containers (this setup)
- **Production:** Cloud databases (Neo4j Aura + hosted PostgreSQL)

The environment is automatically detected based on `NODE_ENV` and database URLs.

## Troubleshooting

### Containers won't start

```bash
# Check if ports are in use
lsof -i :5432  # PostgreSQL
lsof -i :7474  # Neo4j HTTP
lsof -i :7687  # Neo4j Bolt

# Reset everything
npm run docker:reset
```

### Database connection issues

```bash
# Check container health
docker-compose ps

# View logs
npm run docker:logs

# Restart specific service
docker-compose restart postgres
docker-compose restart neo4j
```

### Prisma issues

```bash
# Regenerate Prisma client
npm run db:generate

# Reset database
npm run docker:reset
npm run db:migrate
```

### Neo4j data issues

```bash
# Reseed Neo4j
npm run neo4j:seed

# Access Neo4j shell directly
docker exec -it dance-chives-neo4j cypher-shell -u neo4j -p dev_password
```

## Production vs Development

- **Development:** Uses local Docker containers with test data
- **Production:** Uses cloud services (Neo4j Aura, hosted PostgreSQL)
- Environment variables automatically switch between configurations
- No code changes needed when deploying to production
