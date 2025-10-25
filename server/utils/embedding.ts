// Eg: "TypeError: Cannot read property 'x' of undefined"
// → [0.002, 0.318, -0.051, ..., 0.924]

// That long vector of numbers captures context, meaning, and similarity between different errors.
// The embedding response format from Voyage
interface VoyageEmbeddingResponse {
  data: { embedding: number[] }[];
}

// Voyage model we’re using
const EXPECTED_DIM = 1024; // voyage-3.5-lite produces 1024-d vectors

/**
 * generateIncidentEmbedding
 * Turns a string (error message + context) into a semantic vector.
 * This is the "memory encoding" step.
 */
export async function generateIncidentEmbedding(
  text: string
): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  const model = process.env.VOYAGE_MODEL ?? "voyage-3.5-lite";

  if (!apiKey) {
    throw new Error("Missing VOYAGE_API_KEY in env");
  }

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as VoyageEmbeddingResponse;
  const emb = json?.data?.[0]?.embedding;
  if (!emb || !Array.isArray(emb)) {
    throw new Error("Voyage: missing embedding");
  }

  // basic safety check: if dim changes, we'll notice
  if (emb.length !== EXPECTED_DIM) {
    console.warn(
      `⚠ Voyage embedding dim ${emb.length} != EXPECTED_DIM ${EXPECTED_DIM}. ` +
        `Update EXPECTED_DIM if you're intentionally using a different model.`
    );
  }

  return emb;
}
