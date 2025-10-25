import { Router } from "express";
import { diagnoseIncident } from "../handlers/diagnoseHandler";

const router = Router();
router.post("/", diagnoseIncident);
export default router;
