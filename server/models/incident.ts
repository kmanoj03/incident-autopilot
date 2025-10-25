import { randomUUID } from "crypto";
import { redis } from "../utils/redisClient";
import { generateIncidentEmbedding } from "../utils/embedding";

export interface Incident {
  id: string;
  description: string;
  service: string;
  environment: string;
  rootCauseSummary: string;
  patchDiff?: string;
  timestamp: number;
  embedding: number[]; // VoyageAI vector
  tags: Record<string, string>;
}

// Create & persist using basic Redis SET
export async function createIncidentRedis(
  data: Omit<Incident, "id" | "timestamp" | "embedding">
): Promise<Incident> {
  // 1. Build input text for semantic meaning:
  // Error + service + env + human summary of cause.
  const embeddingInput = [
    data.description,
    data.service,
    data.environment,
    data.rootCauseSummary,
  ].join(" | ");

  // 2. Get embedding from Voyage
  const vector = await generateIncidentEmbedding(embeddingInput);

  // 3. Final incident object
  const incident: Incident = {
    ...data,
    id: randomUUID(),
    timestamp: Date.now(),
    embedding: vector,
    tags: {
      service: data.service,
      environment: data.environment,
    },
  };

  await redis.set(`incident:${incident.id}`, JSON.stringify(incident));

  return incident;
}

// Fetch ALL incidents from Redis (unchanged logic except types)
export async function getAllIncidentsRedis(): Promise<Incident[]> {
  const keys = await redis.keys("incident:*");
  if (keys.length === 0) return [];

  const values = await redis.mGet(keys); // (string | null)[]

  const incidents: Incident[] = [];
  for (const v of values) {
    if (!v) continue;
    try {
      const parsed = JSON.parse(v) as Incident;
      incidents.push(parsed);
    } catch (e) {
      console.error("failed to parse incident json:", e);
    }
  }

  return incidents;
}

export async function getIncidentByIdRedis(
  id: string
): Promise<Incident | null> {
  const raw = await redis.get(`incident:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Incident;
  } catch {
    return null;
  }
}
