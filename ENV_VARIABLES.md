# Environment Variables Reference

This document shows all environment variables needed for different environments.

## Quick Reference

### Development (Local Docker)

```env
APP_ENV="development"
NODE_ENV="development"

# Local Docker PostgreSQL (PostgreSQL 17)
DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/dance_chives_dev?schema=public"

# Local Docker Neo4j
NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="dev_password"
```

### Staging (Neon + Neo4j Aura)

```env
APP_ENV="staging"
NODE_ENV="production"

# Neon PostgreSQL
DATABASE_URL="postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require"

# Neo4j Aura
NEO4J_URI="bolt://[your-instance].databases.neo4j.io:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="[your-password]"
```

### Production (Neon + Neo4j Aura)

```env
APP_ENV="production"
NODE_ENV="production"

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
APP_ENV="development" | "staging" | "production"
NODE_ENV="development" | "production"  # Note: staging uses "production" for Next.js builds

# Database
DATABASE_URL="postgresql://[connection-string]"
NEO4J_URI="bolt://[neo4j-uri]"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="[password]"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"  # or your production URL
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Public URLs (for client-side usage)
NEXT_PUBLIC_ORIGIN="http://localhost:3000"  # or your production URL
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### Optional Variables

```env
# Cloudflare R2 (for file storage)
CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key-id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-access-key"
CLOUDFLARE_R2_PUBLIC_URL="https://your-r2-public-url.com"

# Google Cloud Storage (for file storage)
GCP_SERVICE_ACCOUNT_B64="base64-encoded-service-account-json"
```

## How It Works

**All environments use the same variable names** - there are no `DEV_*` prefixes anymore.

The app determines which environment it's in by checking `APP_ENV` first (which overrides `NODE_ENV`), then falling back to `NODE_ENV`:

- **Development**: `APP_ENV="development"` or `NODE_ENV="development"`
- **Staging**: `APP_ENV="staging"` (even when `NODE_ENV="production"` for Next.js builds)
- **Production**: `APP_ENV="production"` or `NODE_ENV="production"`

This approach allows staging to work correctly even when Next.js forces `NODE_ENV=production` during builds.

## Example Configurations

### `.env.development` (Development - Git Ignored)

```env
APP_ENV="development"
NODE_ENV="development"

# Local Docker
DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/dance_chives_dev?schema=public"
NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="dev_password"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"

# Google OAuth
GOOGLE_CLIENT_ID="your-dev-client-id"
GOOGLE_CLIENT_SECRET="your-dev-client-secret"

# Public URLs
NEXT_PUBLIC_ORIGIN="http://localhost:3000"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### `.env.staging` (Staging - Git Ignored)

```env
APP_ENV="staging"
NODE_ENV="production"

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

# Public URLs
NEXT_PUBLIC_ORIGIN="https://staging.yourdomain.com"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### `.env.production` (Production - Set in Hosting Platform)

```env
APP_ENV="production"
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

# Public URLs
NEXT_PUBLIC_ORIGIN="https://yourdomain.com"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
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

- **Never commit `.env*` files** - they contain secrets
- **Use different secrets** for development, staging, and production
- **Neon requires SSL** - always include `?sslmode=require` in connection string
- **All environments use the same variable names** - `DATABASE_URL`, `NEO4J_URI`, etc. (no `DEV_*` prefixes)
- **`APP_ENV` overrides `NODE_ENV`** - This is how we distinguish staging from production when Next.js forces `NODE_ENV=production` for builds
- **Staging uses `NODE_ENV=production`** - This is required by Next.js, but `APP_ENV=staging` tells the app it's staging
