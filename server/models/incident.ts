import { randomUUID } from "crypto";
import { redis } from "../utils/redisClient";

export interface Incident {
  id: string;
  description: string;
  service: string;
  environment: string;
  rootCauseSummary: string;
  patchDiff?: string;
  timestamp: number;
  embedding: number[];
  tags: Record<string, string>;
}

// Create & persist a new incident in Redis
export async function createIncidentRedis(
  data: Omit<Incident, "id" | "timestamp">
): Promise<Incident> {
  const incident: Incident = {
    ...data,
    id: randomUUID(),
    timestamp: Date.now(),
  };

  // Store as JSON string in Redis
  await redis.set(`incident:${incident.id}`, JSON.stringify(incident));

  return incident;
}

// Fetch all incidents
export async function getAllIncidentsRedis(): Promise<Incident[]> {
  // 1. get all keys with prefix incident:
  const keys = await redis.keys("incident:*");
  if (keys.length === 0) return [];

  // 2. fetch all values
  const values = await redis.mGet(keys);

  // 3. parse JSON strings
  const incidents: Incident[] = [];
  for (const value of values) {
    if (value) {
      try {
        incidents.push(JSON.parse(value));
      } catch (err) {
        console.error("Failed to parse incident:", err);
      }
    }
  }

  return incidents;
}

// Fetch a single incident
export async function getIncidentByIdRedis(
  id: string
): Promise<Incident | null> {
  const data = await redis.get(`incident:${id}`);
  
  if (!data) return null;

  try {
    return JSON.parse(data) as Incident;
  } catch (err) {
    console.error("Failed to parse incident:", err);
    return null;
  }
}
