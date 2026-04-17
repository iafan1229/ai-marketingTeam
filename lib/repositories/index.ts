import { createMemoryHealthlogRepository } from "@/lib/repositories/memory";
import type { HealthlogRepository } from "@/lib/repositories/contracts";

let repository: HealthlogRepository | undefined;

function createConfiguredRepository(): HealthlogRepository {
  return createMemoryHealthlogRepository();
}

export function getHealthlogRepository(): HealthlogRepository {
  repository ??= createConfiguredRepository();
  return repository;
}
