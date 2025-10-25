import { redis } from "./redisClient";

/**
 * ensureIncidentIndex
 * 
 * Creates the RediSearch index "incidents" if it doesn't exist yet.
 * This index enables vector similarity search over incident embeddings.
 * 
 * Schema:
 * - service: TAG (exact match filtering)
 * - environment: TAG (exact match filtering)
 * - description: TEXT (full-text search)
 * - rootCauseSummary: TEXT (full-text search)
 * - patchDiff: TEXT (full-text search)
 * - timestamp: NUMERIC (range queries, sorting)
 * - embedding: VECTOR (1024-dim Float32, HNSW index for KNN)
 */
export async function ensureIncidentIndex(): Promise<void> {
  try {
    // Check if index already exists
    await redis.ft.info("incidents");
    console.log("✅ RediSearch index 'incidents' already exists");
  } catch (err: any) {
    // Index doesn't exist, create it
    if (err.message?.includes("Unknown index name")) {
      console.log("📊 Creating RediSearch index 'incidents'...");
      
      try {
        await redis.ft.create(
          "incidents",
          {
            service: {
              type: "TAG",
              AS: "service",
            },
            environment: {
              type: "TAG",
              AS: "environment",
            },
            description: {
              type: "TEXT",
              AS: "description",
            },
            rootCauseSummary: {
              type: "TEXT",
              AS: "rootCauseSummary",
            },
            patchDiff: {
              type: "TEXT",
              AS: "patchDiff",
            },
            timestamp: {
              type: "NUMERIC",
              AS: "timestamp",
            },
            embedding: {
              type: "VECTOR",
              ALGORITHM: "HNSW",
              TYPE: "FLOAT32",
              DIM: 1024,
              DISTANCE_METRIC: "COSINE",
              AS: "embedding",
            },
          },
          {
            ON: "HASH",
            PREFIX: "incident:",
          }
        );
        
        console.log("✅ RediSearch index 'incidents' created successfully!");
        console.log("   - Vector dimensions: 1024 (Voyage AI)");
        console.log("   - Algorithm: HNSW (Hierarchical Navigable Small World)");
        console.log("   - Distance metric: COSINE");
      } catch (createErr: any) {
        console.error("❌ Failed to create RediSearch index:", createErr.message);
        throw createErr;
      }
    } else {
      // Some other error checking the index
      console.error("❌ Error checking RediSearch index:", err.message);
      throw err;
    }
  }
}

