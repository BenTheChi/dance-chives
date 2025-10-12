#!/bin/bash
# Neo4j initialization script

echo "Waiting for Neo4j to be ready..."
until cypher-shell -u neo4j -p dev_password "RETURN 1" > /dev/null 2>&1; do
  sleep 2
done

echo "Neo4j is ready. Loading test data..."
cypher-shell -u neo4j -p dev_password -f /docker-entrypoint-initdb.d/01-test-data.cypher

echo "Neo4j test data loaded successfully!"
