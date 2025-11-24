# Environment Variables Reference

This document shows all environment variables needed for different environments.

## Quick Reference

### Development (Local Docker)

Use these when `NODE_ENV="development"`:

```env
NODE_ENV="development"

# Local Docker PostgreSQL (PostgreSQL 17)
DEV_DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/dance_chives_dev?schema=public"

# Local Docker Neo4j
DEV_NEO4J_URI="bolt://localhost:7687"
DEV_NEO4J_USERNAME="neo4j"
DEV_NEO4J_PASSWORD="dev_password"
```

### Staging/Production (Neon + Neo4j Aura)

Use these when `NODE_ENV="staging"` or `NODE_ENV="production"`:

```env
NODE_ENV="staging"  # or "production"

# Neon PostgreSQL
DATABASE_URL="postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require"

# Neo4j Aura
NEO4J_URI="bolt://[your-instance].databases.neo4j.io:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="[your-password]"
```

## Complete Environment Variable List

### Required for All Environments

```env
# Environment
NODE_ENV="development" | "staging" | "production"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"  # or your production URL
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Development Only (when NODE_ENV="development")

```env
# Local Docker PostgreSQL
DEV_DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/dance_chives_dev?schema=public"

# Local Docker Neo4j
DEV_NEO4J_URI="bolt://localhost:7687"
DEV_NEO4J_USERNAME="neo4j"
DEV_NEO4J_PASSWORD="dev_password"
```

### Staging/Production Only (when NODE_ENV="staging" or "production")

```env
# Neon PostgreSQL Connection String
# Get from: Neon Dashboard → Project → Connection Details
DATABASE_URL="postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require"

# Neo4j Aura Connection
NEO4J_URI="bolt://[instance-id].databases.neo4j.io:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="[your-neo4j-password]"
```

## How It Works

The app automatically selects which variables to use based on `NODE_ENV`:

- **Development**: Uses `DEV_*` prefixed variables (falls back to standard names if DEV\_ vars not set)
- **Staging/Production**: Uses standard variable names (`DATABASE_URL`, `NEO4J_URI`, etc.)

## Example Configurations

### `.env.local` (Development - Git Ignored)

```env
NODE_ENV="development"

# Local Docker
DEV_DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/dance_chives_dev?schema=public"
DEV_NEO4J_URI="bolt://localhost:7687"
DEV_NEO4J_USERNAME="neo4j"
DEV_NEO4J_PASSWORD="dev_password"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"

# Google OAuth
GOOGLE_CLIENT_ID="your-dev-client-id"
GOOGLE_CLIENT_SECRET="your-dev-client-secret"
```

### `.env` (Staging - Git Ignored)

```env
NODE_ENV="staging"

# Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:abc123@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Neo4j Aura
NEO4J_URI="bolt://abc123.databases.neo4j.io:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="your-neo4j-password"

# NextAuth
NEXTAUTH_URL="https://staging.yourdomain.com"
NEXTAUTH_SECRET="staging-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-staging-client-id"
GOOGLE_CLIENT_SECRET="your-staging-client-secret"
```

### Production (Set in Hosting Platform - Vercel/GCloud Run)

```env
NODE_ENV="production"

# Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:xyz789@ep-production-789012.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Neo4j Aura
NEO4J_URI="bolt://xyz789.databases.neo4j.io:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="your-production-neo4j-password"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secret-key-use-random-string"

# Google OAuth
GOOGLE_CLIENT_ID="your-production-client-id"
GOOGLE_CLIENT_SECRET="your-production-client-secret"
```

## Getting Your Neon Connection String

1. Go to https://neon.tech
2. Sign up or log in
3. Create a new project (or select existing)
4. Click "Connection Details" in your project
5. Copy the connection string
6. It will look like:
   ```
   postgresql://user:password@hostname/database?sslmode=require
   ```
7. Use this as your `DATABASE_URL` for staging/production

## Notes

- **Never commit `.env` or `.env.local` files** - they contain secrets
- **Use different secrets** for development, staging, and production
- **Neon requires SSL** - always include `?sslmode=require` in connection string
- **DEV\_ variables are optional** - if not set, falls back to standard variable names
