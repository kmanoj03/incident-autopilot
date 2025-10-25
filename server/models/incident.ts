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
  embedding: number[];
}

// Helper to convert float[] → Buffer (float32)
function float32Buffer(vector: number[]): Buffer {
  return Buffer.from(new Float32Array(vector).buffer);
}

// Save incident as Redis HASH
export async function createIncidentRedis(
  data: Omit<Incident, "id" | "timestamp" | "embedding">
): Promise<Incident> {
  const embeddingInput = [
    data.description,
    data.service,
    data.environment,
    data.rootCauseSummary,
  ].join(" | ");

  const vector = await generateIncidentEmbedding(embeddingInput);

  const incident: Incident = {
    ...data,
    id: randomUUID(),
    timestamp: Date.now(),
    embedding: vector,
  };

  await redis.hSet(`incident:${incident.id}`, {
    description: incident.description,
    service: incident.service,
    environment: incident.environment,
    rootCauseSummary: incident.rootCauseSummary,
    patchDiff: incident.patchDiff ?? "",
    timestamp: incident.timestamp.toString(),
    // store embedding as binary buffer
    embedding: float32Buffer(vector),
  });

  return incident;
}

// Fetch all incidents from Redis
// Note: Excludes embedding field for performance (it's 1024 floats = 4KB per incident)
// Embeddings are used internally for vector search, not needed for GET requests
export async function getAllIncidentsRedis(): Promise<Incident[]> {
  const keys = await redis.keys("incident:*");
  if (keys.length === 0) return [];

  const incidents: Incident[] = [];

  for (const key of keys) {
    try {
      // Get all hash fields except embedding (which is binary)
      const hash = await redis.hGetAll(key);
      if (!hash || !hash.description) continue;

      incidents.push({
        id: key.replace("incident:", ""),
        description: hash.description,
        service: hash.service,
        environment: hash.environment,
        rootCauseSummary: hash.rootCauseSummary,
        patchDiff: hash.patchDiff || undefined,
        timestamp: parseInt(hash.timestamp),
        embedding: [], // Excluded for performance - stored in Redis for vector search
      });
    } catch (err) {
      console.error(`Error parsing incident ${key}:`, err);
      // Skip this incident and continue
    }
  }

  return incidents;
}
