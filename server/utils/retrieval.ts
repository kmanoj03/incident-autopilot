// Filters incidents by metadata -> ranks by cosine similarity.

import { Incident } from "../models/incident";
import { cosineSimilarity } from "./similarity";

export function findSimilarIncidents(
  queryEmbedding: number[],
  service: string,
  environment: string,
  allIncidents: Incident[]
) {
  const filtered = allIncidents.filter(
    (i) => i.service === service && i.environment === environment
  );

  const scored = filtered.map((inc) => ({
    ...inc,
    similarity: cosineSimilarity(queryEmbedding, inc.embedding),
  }));

  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}
