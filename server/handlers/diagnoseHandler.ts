// Glues everything ; from embeddings ->retrieval -> response

import { Request, Response } from "express";
import { getAllIncidents } from "../models/incident";
import { embedText } from "../utils/embedding";
import { findSimilarIncidents } from "../utils/retrieval";

export function diagnoseIncident(req: Request, res: Response) {
  try {
    const { description, service, environment } = req.body || {};
    if (!description || !service || !environment) {
      return res
        .status(400)
        .json({ error: "description, service, environment are required" });
    }

    const queryEmbedding = embedText(
      `${description} | ${service} | ${environment}`
    );
    const all = getAllIncidents();
    const matches = findSimilarIncidents(
      queryEmbedding,
      service,
      environment,
      all
    );

    if (!matches.length) {
      return res.status(200).json({
        message: "No similar incidents found yet. Might be a new error.",
        suggestedFix: {
          summary:
            "No prior fixes — developer may need to investigate manually and add this after resolution.",
          confidence: "low",
        },
      });
    }

    const top = matches[0];
    const suggestedFix = {
      summary: top.rootCauseSummary,
      patchDiffDraft:
        top.patchDiff ||
        "// placeholder: add null guard or condition similar to previous patch",
      confidence:
        top.similarity > 0.9 ? "high" : top.similarity > 0.7 ? "medium" : "low",
    };

    return res.status(200).json({ matches, suggestedFix });
  } catch (err) {
    console.error("diagnoseIncident error:", err);
    res.status(500).json({ error: "internal_error" });
  }
}
