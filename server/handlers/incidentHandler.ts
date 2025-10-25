import { Request, Response } from "express";
import { createIncidentRedis, getAllIncidentsRedis } from "../models/incident";
import { embedText } from "../utils/embedding";

export async function postIncident(req: Request, res: Response) {
  try {
    const { description, service, environment, rootCauseSummary, patchDiff } =
      req.body || {};

    if (!description || !service || !environment || !rootCauseSummary) {
      return res.status(400).json({
        error:
          "description, service, environment, rootCauseSummary are required",
      });
    }

    const embeddingInput = [
      description,
      service,
      environment,
      rootCauseSummary,
    ].join(" | ");

    const incident = await createIncidentRedis({
      description,
      service,
      environment,
      rootCauseSummary,
      patchDiff,
      embedding: embedText(embeddingInput),
      tags: { service, environment },
    });

    return res.status(201).json(incident);
  } catch (err) {
    console.error("postIncident error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
}

export async function listIncidentsHandler(_req: Request, res: Response) {
  try {
    const data = await getAllIncidentsRedis();
    return res.json(data);
  } catch (err) {
    console.error("listIncidents error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
}
