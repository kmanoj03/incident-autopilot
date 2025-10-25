// routes/incidentsRoute.ts
import { Router } from "express";
import {
  postIncident,
  listIncidentsHandler,
} from "../handlers/incidentHandler";

const router = Router();

// Add a new incident (after a fix)
router.post("/", postIncident);

// List all incidents (debug / demo)
router.get("/", listIncidentsHandler);

export default router;
