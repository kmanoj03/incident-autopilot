import { Router } from "express";
import { applyPatch } from "../handlers/patchHandler";

const router = Router();
router.post("/apply", applyPatch);

export default router;
