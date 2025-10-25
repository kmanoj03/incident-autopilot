import { Request, Response } from "express";
import { createIncident, getAllIncidents } from "../models/incident";
import { embedText } from "../utils/embedding";

export function postIncident(req: Request, res: Response) {
  try {
    const { description, service, environment, rootCauseSummary, patchDiff } =
      req.body || {};

    if (!description || !service || !environment || !rootCauseSummary) {
      return res.status(400).json({
        error:
          "description, service, environment, rootCauseSummary are required",
      });
    }

    // build embedding input
    const embeddingInput = [
      description,
      service,
      environment,
      rootCauseSummary,
    ].join(" | ");

    const incident = createIncident({
      description,
      service,
      environment,
      rootCauseSummary,
      patchDiff,
      embedding: embedText(embeddingInput),
      tags: {
        service,
        environment,
      },
    });

    return res.status(201).json(incident);
  } catch (err) {
    console.error("postIncident error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
}

export function listIncidentsHandler(_req: Request, res: Response) {
  const data = getAllIncidents();
  return res.json(data);
}
