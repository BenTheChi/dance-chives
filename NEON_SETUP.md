# Neon Database Setup Guide

This guide explains how to configure your environment variables to use Neon PostgreSQL instead of local Docker Postgres.

## Environment Variable Configuration

### For Development (Local Docker)

When `NODE_ENV="development"`, the app uses `DEV_` prefixed variables:

```env
# .env.local (for local development)
NODE_ENV="development"

# Use local Docker containers
DEV_DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/dance_chives_dev?schema=public"
DEV_NEO4J_URI="bolt://localhost:7687"
DEV_NEO4J_USERNAME="neo4j"
DEV_NEO4J_PASSWORD="dev_password"
```

### For Staging/Production (Neon)

When `NODE_ENV` is `"staging"` or `"production"`, the app uses standard variables:

```env
# .env (for staging/production)
NODE_ENV="staging"  # or "production"

# Neon PostgreSQL Connection String
# Get this from: Neon Dashboard → Your Project → Connection Details → Connection String
DATABASE_URL="postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require"

# Example format:
# DATABASE_URL="postgresql://neondb_owner:npg_abc123xyz@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Neo4j Aura (your existing setup)
NEO4J_URI="bolt://[your-neo4j-instance].databases.neo4j.io:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="[your-neo4j-password]"
```

## Getting Your Neon Connection String

1. **Sign up/Login to Neon**: https://neon.tech
2. **Create a Project** (or use existing)
3. **Get Connection String**:
   - Go to Dashboard → Your Project
   - Click "Connection Details"
   - Copy the connection string
   - It will look like: `postgresql://user:password@hostname/database?sslmode=require`

## Migration Steps

### 1. Set up Neon Database

```bash
# Create a Neon project at https://neon.tech
# Copy your connection string
```

### 2. Update Environment Variables

**For Staging/Production** (`.env` or your hosting platform):

```env
NODE_ENV="staging"  # or "production"
DATABASE_URL="postgresql://[your-neon-connection-string]?sslmode=require"
```

**For Development** (`.env.local`):

```env
NODE_ENV="development"
DEV_DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/dance_chives_dev?schema=public"
```

### 3. Run Migrations on Neon

```bash
# Make sure DATABASE_URL points to Neon
export DATABASE_URL="postgresql://[your-neon-connection-string]?sslmode=require"

# Deploy migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npm run db:seed
```

### 4. Verify Connection

```bash
# Test connection
npx prisma db pull

# Or use Prisma Studio
npx prisma studio
```

## Connection String Format

Neon connection strings typically look like:

```
postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require
```

**Important Notes:**

- Always include `?sslmode=require` for Neon
- The connection string includes username, password, hostname, and database name
- Neon uses connection pooling automatically

## Switching Between Local and Neon

The app automatically switches based on `NODE_ENV`:

- **Development** (`NODE_ENV="development"`): Uses `DEV_DATABASE_URL` → Local Docker
- **Staging/Production** (`NODE_ENV="staging"` or `"production"`): Uses `DATABASE_URL` → Neon

No code changes needed! Just update your environment variables.

## Troubleshooting

### Connection Issues

1. **Check SSL**: Make sure `?sslmode=require` is in your connection string
2. **Verify Connection String**: Copy it directly from Neon dashboard
3. **Test Connection**: Use `npx prisma db pull` to test

### Migration Issues

1. **Use Direct Connection**: For migrations, use the direct connection string (not pooler)
2. **Check Permissions**: Ensure your Neon user has CREATE/DROP permissions
3. **View Logs**: Check Neon dashboard for connection logs

### Environment Variable Issues

1. **Check NODE_ENV**: Make sure it's set correctly
2. **Verify Variable Names**: Use `DATABASE_URL` for production, `DEV_DATABASE_URL` for dev
3. **Restart Server**: After changing env vars, restart your Next.js server

## Neon Free Tier Limits

- **Compute**: 191.9 hours/month (plenty for your read-heavy workload)
- **Storage**: 0.5 GB (should cover 1,000-2,000 users)
- **Projects**: Unlimited
- **Scale to Zero**: Yes (no cost when idle)

You should be able to stay on the free tier for your first 1,000+ users!
