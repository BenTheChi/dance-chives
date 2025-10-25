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
   DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/dance_chives_dev"
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

### PostgreSQL (Relational Database)

- **Host:** localhost:5432
- **Database:** dance_chives_dev
- **Username:** postgres
- **Password:** dev_password
- **GUI:** Run `npm run db:studio` to open **Prisma Studio**
- **Purpose:** Stores user authentication, OAuth accounts, and invitations

**How to Access:**

```bash
npm run db:studio
```

Then open your browser to the URL shown (usually http://localhost:5555)

### Neo4j (Graph Database)

- **Bolt URL:** bolt://localhost:7687
- **HTTP URL:** http://localhost:7474
- **Username:** neo4j
- **Password:** dev_password
- **Browser:** Visit **http://localhost:7474** for **Neo4j Browser** (Graph UI)
- **Purpose:** Stores events, cities, users profiles, sections, videos, and all relationships

**How to Access:**

1. Open your browser to **http://localhost:7474**
2. Connect using:
   - **Connect URL:** `bolt://localhost:7687`
   - **Username:** `neo4j`
   - **Password:** `dev_password`
3. Run Cypher queries to explore data:

   ```cypher
   // View all events
   MATCH (e:Event) RETURN e LIMIT 25

   // View event relationships
   MATCH (e:Event)-[r]->(n) RETURN e, r, n LIMIT 100

   // View all cities with their events
   MATCH (c:City)<-[:IN]-(e:Event) RETURN c, e
   ```

> **Note:** Prisma Studio only works with SQL databases (PostgreSQL). For Neo4j, you must use Neo4j Browser at http://localhost:7474

## Test Data

The setup includes comprehensive test data automatically seeded when you run `npm run db:setup`:

### PostgreSQL Test Data

- **5 test users** with different auth levels:
  - Alice Johnson (test-user-1) - REGIONAL_MODERATOR (auth: 3)
  - Bob Smith (test-user-2) - GLOBAL_CREATOR (auth: 2)
  - Carol Davis (test-user-3) - REGIONAL_CREATOR (auth: 1)
  - David Wilson (test-user-4) - REGIONAL_CREATOR (auth: 1, unverified)
  - Eva Martinez (test-user-5) - BASE_USER (auth: 0, unverified)
- **OAuth account records** for all test users (Google provider)
- **3 test invitations** (2 pending, 1 used)
- User emails: alice@example.com, bob@example.com, carol@example.com, david@example.com, eva@example.com

### Neo4j Test Data

- **10 Cities** across 5 countries:

  - US: New York, Los Angeles, Chicago, Miami, Seattle
  - UK: London
  - France: Paris
  - Japan: Tokyo
  - South Korea: Seoul
  - Canada: Toronto

- **5 User Profiles** (matching PostgreSQL users with usernames and display names)

- **10 Comprehensive Events** with full details:

  - Summer Battle Championship 2024 (New York)
  - West Coast Cypher Sessions (Los Angeles)
  - Chicago All Styles Jam 2024
  - Miami Heat Breaking Championship
  - Seattle Underground Hip-Hop Jam
  - UK Breaking Showdown 2024 (London)
  - Parisian Breaking Festival 2024
  - Tokyo Breaking Olympics Prep Jam
  - Seoul Street Battle Series 2025
  - Toronto Unity Breaking Jam 2025

- **Each event includes:**

  - Complete event details (description, address, prize, entry cost, dates, times, schedule)
  - Event poster (using real Google Cloud Storage images)
  - Multiple roles (organizers, judges, DJs, MCs) assigned to test users
  - Sections with brackets and videos
  - SubEvents (workshops, panels, after parties, youth events)
  - Gallery photos (2-7 per event using real GCS images)
  - Tagged users in videos (all test users appear across events)

- **Media Statistics:**

  - 54 total videos across all events
  - 60 total images (45 gallery photos + 15 posters)
  - 3 unique real images from Google Cloud Storage distributed across events
  - All videos have tagged users from the test pool

- **Relationship Types:**
  - Users → Events (CREATED, ORGANIZER, HEAD_JUDGE, JUDGE, DJ, MC, etc.)
  - Events → Cities (IN)
  - Events → Sections (IN)
  - Sections → Brackets (IN)
  - Sections/Brackets → Videos (IN)
  - Users → Videos (IN - tagged dancers)
  - Pictures → Events (POSTER, PHOTO)
  - SubEvents → Events (PART_OF)

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
