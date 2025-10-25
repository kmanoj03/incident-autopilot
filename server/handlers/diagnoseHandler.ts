import { Request, Response } from "express";
import { redis } from "../utils/redisClient";
import { generateIncidentEmbedding } from "../utils/embedding";

export async function diagnoseIncident(req: Request, res: Response) {
  try {
    const { description, service, environment } = req.body || {};
    if (!description || !service || !environment) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // create embedding for query
    const queryEmbedding = await generateIncidentEmbedding(
      [description, service, environment].join(" | ")
    );

    const queryBuffer = Buffer.from(new Float32Array(queryEmbedding).buffer);

    // Escape special characters in TAG fields for RediSearch
    // Hyphens, spaces, and other special chars need escaping with backslash
    const escapeTag = (val: string) => val.replace(/([,.<>{}[\]"':;!@#$%^&*()\-+=~\s])/g, '\\$1');
    
    // RediSearch KNN query: filter by service/env, return top 3 most similar
    // Using the correct syntax for vector similarity with filters
    const query = `(@service:{${escapeTag(service)}} @environment:{${escapeTag(environment)}})=>[KNN 3 @embedding $vec AS score]`;

    const results = await redis.ft.search("incidents", query, {
      PARAMS: { vec: queryBuffer },
      RETURN: ["description", "rootCauseSummary", "patchDiff"],
      SORTBY: {
        BY: "score",
        DIRECTION: "ASC",
      },
      DIALECT: 2,
    }) as any;

    if (!results || typeof results !== "object" || !results.documents || results.total === 0) {
      return res.status(200).json({
        message: "No similar incidents found in Redis vector index.",
        suggestedFix: {
          summary:
            "No prior fix stored — investigate manually and POST once resolved.",
          confidence: "low",
        },
      });
    }

    // each doc has .value with hash fields
    const matches = results.documents.map((doc: any) => {
      // The score is stored in doc.value.score or doc.value.__score
      const scoreValue = doc.value.score || doc.value.__score || doc.value.$score || "0";
      const distance = parseFloat(scoreValue);
      // COSINE distance is 0-2 (0=identical, 2=opposite), convert to similarity 0-1
      const similarity = distance <= 1 ? 1 - distance : 0;
      
      return {
        id: doc.id,
        description: doc.value.description,
        rootCauseSummary: doc.value.rootCauseSummary,
        patchDiff: doc.value.patchDiff,
        similarity: parseFloat(similarity.toFixed(4)),
        distance: parseFloat(distance.toFixed(4)),
      };
    });

    const top = matches[0];
    const suggestedFix = {
      summary: top.rootCauseSummary,
      patchDiffDraft: top.patchDiff || "// placeholder fix",
      confidence:
        top.similarity > 0.9 ? "high" : top.similarity > 0.7 ? "medium" : "low",
    };

    res.status(200).json({ matches, suggestedFix });
  } catch (err) {
    console.error("diagnoseIncident error:", err);
    res
      .status(500)
      .json({ error: "internal_error", details: (err as Error).message });
  }
}
