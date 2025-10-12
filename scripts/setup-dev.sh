#!/bin/bash

# Development setup script for dance-chives
set -e

echo "🕺 Setting up Dance Chives development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Please create it with the required environment variables."
    echo "   See DEVELOPMENT.md for the required variables."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🐳 Starting Docker containers..."
docker-compose up -d

echo "⏳ Waiting for databases to be ready..."
sleep 15

# Wait for PostgreSQL
echo "🐘 Waiting for PostgreSQL..."
until docker exec dance-chives-postgres pg_isready -U dev_user -d dance_chives_dev > /dev/null 2>&1; do
    echo "   PostgreSQL is not ready yet..."
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Neo4j
echo "🔗 Waiting for Neo4j..."
until docker exec dance-chives-neo4j cypher-shell -u neo4j -p dev_password "RETURN 1" > /dev/null 2>&1; do
    echo "   Neo4j is not ready yet..."
    sleep 2
done
echo "✅ Neo4j is ready!"

echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

echo "🌱 Seeding databases with test data using existing query functions..."
echo "   🐘 Seeding PostgreSQL..."
npx prisma db seed

echo "   🔗 Seeding Neo4j..."
npm run neo4j:seed

echo "🎉 Setup complete!"
echo ""
echo "🚀 You can now start development with:"
echo "   npm run dev"
echo ""
echo "📊 Database access:"
echo "   PostgreSQL: http://localhost:5432 (Prisma Studio: npm run db:studio)"
echo "   Neo4j: http://localhost:7474"
echo ""
echo "🏥 Health check: http://localhost:3000/api/health"
