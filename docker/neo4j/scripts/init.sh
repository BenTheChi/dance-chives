#!/bin/bash
# Neo4j initialization script
# Note: Seeding is now handled by the prisma-setup service via npm run neo4j:seed

echo "Waiting for Neo4j to be ready..."
until cypher-shell -u neo4j -p dev_password "RETURN 1" > /dev/null 2>&1; do
  sleep 2
done

echo "Neo4j is ready!"
echo "Note: Database seeding is handled by the prisma-setup service."
