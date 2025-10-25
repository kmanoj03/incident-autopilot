import { Request, Response } from "express";
import { getAllIncidentsRedis } from "../models/incident";
import { generateIncidentEmbedding } from "../utils/embedding";
import { findSimilarIncidents } from "../utils/retrieval";

export async function diagnoseIncident(req: Request, res: Response) {
  try {
    const { description, service, environment } = req.body || {};
    if (!description || !service || !environment) {
      return res
        .status(400)
        .json({ error: "description, service, environment are required" });
    }

    // build the query string same style as we did during ingestion
    const queryEmbedding = await generateIncidentEmbedding(
      [description, service, environment].join(" | ")
    );

    // pull all known incidents from Redis
    const allIncidents = await getAllIncidentsRedis();

    // same filter+rank logic, which uses cosine similarity
    const matches = findSimilarIncidents(
      queryEmbedding,
      service,
      environment,
      allIncidents
    );

    if (!matches.length) {
      return res.status(200).json({
        message: "No similar incidents found. New production issue.",
        suggestedFix: {
          summary:
            "No stored fix yet. Investigate root cause, then POST /incidents so future engineers get it instantly.",
          confidence: "low",
        },
      });
    }

    const top = matches[0];

    const suggestedFix = {
      summary: top.rootCauseSummary,
      patchDiffDraft:
        top.patchDiff ||
        "// no stored diff; likely same null/undefined guard pattern or input validation used in similar prod issues",
      confidence:
        top.similarity > 0.9 ? "high" : top.similarity > 0.7 ? "medium" : "low",
    };

    return res.status(200).json({
      matches,
      suggestedFix,
    });
  } catch (err) {
    console.error("diagnoseIncident error:", err);
    res.status(500).json({ error: "internal_error" });
  }
}
