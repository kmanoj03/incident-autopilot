import { Request, Response } from "express";
import { createIncidentRedis, getAllIncidentsRedis } from "../models/incident";

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

    const incident = await createIncidentRedis({
      description,
      service,
      environment,
      rootCauseSummary,
      patchDiff,
      tags: {
        service,
        environment,
      },
      // embedding is now generated internally
      // timestamp and id are also generated internally
    } as any); // small cast because createIncidentRedis expects everything except id/timestamp/embedding

    // Exclude embedding from response (it's 1024 floats and not useful for API consumers)
    const { embedding, ...response } = incident;
    return res.status(201).json(response);
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
