// Database health check utilities
import { prisma } from "./primsa";
import driver from "../db/driver";

export interface HealthCheckResult {
  service: string;
  status: "healthy" | "unhealthy" | "unknown";
  message: string;
  responseTime?: number;
}

// Check PostgreSQL connection via Prisma
export async function checkPostgresHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      service: "PostgreSQL",
      status: "healthy",
      message: "Database connection successful",
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      service: "PostgreSQL",
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Unknown error",
      responseTime,
    };
  }
}

// Check Neo4j connection
export async function checkNeo4jHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const session = driver.session();

  try {
    await session.run("RETURN 1");
    const responseTime = Date.now() - startTime;

    return {
      service: "Neo4j",
      status: "healthy",
      message: "Database connection successful",
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      service: "Neo4j",
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Unknown error",
      responseTime,
    };
  } finally {
    await session.close();
  }
}

// Check all database connections
export async function checkAllDatabases(): Promise<HealthCheckResult[]> {
  const checks = await Promise.all([checkPostgresHealth(), checkNeo4jHealth()]);

  return checks;
}

// Get overall health status
export async function getOverallHealth(): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheckResult[];
}> {
  const checks = await checkAllDatabases();

  const healthyCount = checks.filter(
    (check) => check.status === "healthy"
  ).length;
  const totalCount = checks.length;

  let status: "healthy" | "degraded" | "unhealthy";

  if (healthyCount === totalCount) {
    status = "healthy";
  } else if (healthyCount > 0) {
    status = "degraded";
  } else {
    status = "unhealthy";
  }

  return { status, checks };
}
