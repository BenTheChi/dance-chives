# Environment Variables Setup Guide

This project uses environment-specific `.env` files that are automatically loaded based on `APP_ENV` (which overrides `NODE_ENV`).

## Quick Setup

1. **Create your environment files** by copying the examples below or running:
   ```bash
   # Create .env.development
   cp .env.development.example .env.development
   
   # Create .env.staging (if needed)
   cp .env.staging.example .env.staging
   
   # Create .env.production (if needed)
   cp .env.production.example .env.production
   ```

2. **Fill in your actual values** in each file

3. **The system automatically loads the correct file** based on `APP_ENV` (or `NODE_ENV` as fallback)

## How It Works

- **Development** (`APP_ENV="development"` or `NODE_ENV=development`): Loads `.env.development`
- **Staging** (`APP_ENV="staging"`): Loads `.env.staging` (even when `NODE_ENV=production` for builds)
- **Production** (`APP_ENV="production"` or `NODE_ENV=production`): Loads `.env.production`

The `next.config.ts` file checks `APP_ENV` first, then falls back to `NODE_ENV` to determine which `.env` file to load. This allows staging to work even when Next.js forces `NODE_ENV=production` during builds.

**Key Point**: `APP_ENV` overrides `NODE_ENV` to distinguish between staging and production, since Next.js sets `NODE_ENV=production` for both staging and production builds.

## Environment File Templates

### `.env.development`

```env
# Development Environment Variables
APP_ENV="development"
NODE_ENV="development"

# Local Docker PostgreSQL (PostgreSQL 17)
DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/dance_chives_dev?schema=public"

# Local Docker Neo4j
NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="dev_password"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Public URLs (for client-side usage)
NEXT_PUBLIC_ORIGIN="http://localhost:3000"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Cloudflare R2 (Optional - for file storage)
# CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
# CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key-id"
# CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-access-key"
# CLOUDFLARE_R2_PUBLIC_URL="https://your-r2-public-url.com"

# Google Cloud Storage (Optional - for file storage)
# GCP_SERVICE_ACCOUNT_B64="base64-encoded-service-account-json"
```

### `.env.staging`

```env
# Staging Environment Variables
APP_ENV="staging"
NODE_ENV="production"

# Neon PostgreSQL Connection String
# Get from: Neon Dashboard → Project → Connection Details
DATABASE_URL="postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require"

# Neo4j Aura Connection
NEO4J_URI="bolt://[instance-id].databases.neo4j.io:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="your-neo4j-password"

# NextAuth Configuration
NEXTAUTH_URL="https://staging.yourdomain.com"
NEXTAUTH_SECRET="staging-secret-key-use-random-string"

# Google OAuth
GOOGLE_CLIENT_ID="your-staging-google-client-id"
GOOGLE_CLIENT_SECRET="your-staging-google-client-secret"

# Public URLs (for client-side usage)
NEXT_PUBLIC_ORIGIN="https://staging.yourdomain.com"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Cloudflare R2 (Optional - for file storage)
# CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
# CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key-id"
# CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-access-key"
# CLOUDFLARE_R2_PUBLIC_URL="https://your-r2-public-url.com"

# Google Cloud Storage (Optional - for file storage)
# GCP_SERVICE_ACCOUNT_B64="base64-encoded-service-account-json"
```

### `.env.production`

```env
# Production Environment Variables
APP_ENV="production"
NODE_ENV="production"

# Neon PostgreSQL Connection String
# Get from: Neon Dashboard → Project → Connection Details
DATABASE_URL="postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require"

# Neo4j Aura Connection
NEO4J_URI="bolt://[instance-id].databases.neo4j.io:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="your-production-neo4j-password"

# NextAuth Configuration
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secret-key-use-random-string-generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"

# Public URLs (for client-side usage)
NEXT_PUBLIC_ORIGIN="https://yourdomain.com"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Cloudflare R2 (Optional - for file storage)
# CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
# CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key-id"
# CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-access-key"
# CLOUDFLARE_R2_PUBLIC_URL="https://your-r2-public-url.com"

# Google Cloud Storage (Optional - for file storage)
# GCP_SERVICE_ACCOUNT_B64="base64-encoded-service-account-json"
```

## Usage in Scripts

The `package.json` scripts use `APP_ENV` for staging builds and rely on Next.js's built-in env loading:

- **Development scripts** (default): Uses `.env.development` automatically
- **Staging scripts**: Sets `APP_ENV=staging` to load `.env.staging` (even though `NODE_ENV=production`)
- **Production scripts**: Uses `.env.production` automatically

### Examples

```bash
# Development (default)
npm run dev
npm run neo4j:seed

# Staging
npm run build:staging  # Sets APP_ENV=staging, loads .env.staging
npm run start:staging  # Sets APP_ENV=staging, loads .env.staging
npm run neo4j:seed:staging  # Uses dotenv-cli to load .env.staging

# Production
npm run build  # Uses .env.production
npm run start  # Uses .env.production
npm run neo4j:seed:production  # Uses dotenv-cli to load .env.production
```

## Manual Environment Loading

If you need to manually load environment variables in a script, you can use `dotenv-cli`:

```bash
# Development
dotenv -e .env.development -- your-command

# Staging
dotenv -e .env.staging -- your-command

# Production
dotenv -e .env.production -- your-command
```

## Important Notes

1. **Never commit `.env*` files** - They are already in `.gitignore`
2. **Use different secrets** for each environment
3. **For production deployments** (Vercel, etc.), set environment variables in your hosting platform's dashboard
4. **All environments use the same variable names** - No more `DEV_*` prefixes
5. **`APP_ENV` overrides `NODE_ENV`** - This allows staging to work even when Next.js forces `NODE_ENV=production` for builds
6. **Staging uses `NODE_ENV=production`** - This is required by Next.js for builds, but `APP_ENV=staging` distinguishes it from production

## Troubleshooting

If environment variables aren't loading:

1. Check that the `.env.{environment}` file exists
2. Verify `APP_ENV` is set in the file (or `NODE_ENV` for development)
3. For staging builds, ensure `APP_ENV=staging` is set in the script or environment
4. Check the console output when starting the app - it should show which env file is being loaded
5. For Next.js, remember that only variables prefixed with `NEXT_PUBLIC_` are available on the client side
