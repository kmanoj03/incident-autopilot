import { randomUUID } from "crypto";

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

// internal in-memory store
const incidents: Incident[] = [];

// Create
export function createIncident(
  data: Omit<Incident, "id" | "timestamp">
): Incident {
  const incident: Incident = {
    ...data,
    id: randomUUID(),
    timestamp: Date.now(),
  };
  incidents.push(incident);
  return incident;
}

// Read all
export function getAllIncidents(): Incident[] {
  return incidents;
}

// Read one
export function getIncidentById(id: string): Incident | undefined {
  return incidents.find((i) => i.id === id);
}

// (utility for testing / resetting if you ever need it)
export function _clearIncidents() {
  incidents.length = 0;
}
