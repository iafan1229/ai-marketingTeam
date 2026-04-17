import type { HealthlogRepository } from "@/lib/repositories/contracts";
import { createMemoryHealthlogRepository } from "@/lib/repositories/memory";
import { createPostgresHealthlogRepository } from "@/lib/repositories/postgres";

let repository: HealthlogRepository | undefined;

function getRepositoryDriver() {
  return process.env.REPOSITORY_DRIVER?.toLowerCase() === "postgres"
    ? "postgres"
    : "memory";
}

function createConfiguredRepository(): HealthlogRepository {
  if (getRepositoryDriver() === "postgres") {
    return createPostgresHealthlogRepository();
  }

  return createMemoryHealthlogRepository();
}

export function getHealthlogRepository(): HealthlogRepository {
  repository ??= createConfiguredRepository();
  return repository;
}

export { getRepositoryDriver };
