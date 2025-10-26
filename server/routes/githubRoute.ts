import { Router } from "express";
import { createGitHubIssue, createGitHubPR } from "../handlers/githubHandler";

const router = Router();

// POST /github/issue - Create a GitHub issue for an incident
router.post("/issue", createGitHubIssue);

// POST /github/pr - Create a GitHub PR for a hotfix
router.post("/pr", createGitHubPR);

export default router;

