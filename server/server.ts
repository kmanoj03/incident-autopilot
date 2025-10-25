import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import incidentsRoute from "./routes/incidentRoute";
import diagnoseRoute from "./routes/diagnoseRoute";
import patchRoute from "./routes/patchRoute";

import { initRedis } from "./utils/redisClient";
import { ensureIncidentIndex } from "./utils/createIndex";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Health check
app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, message: "Server running fine ✅" });
});

app.use("/incidents", incidentsRoute);
app.use("/diagnose", diagnoseRoute);
app.use("/patch", patchRoute);

async function start() {
  // 1. Connect to Redis
  await initRedis();
  
  // 2. Ensure the vector search index exists
  await ensureIncidentIndex();
  
  // 3. Start the server
  app.listen(PORT, () => {
    console.log(`⚡ Server running at http://localhost:${PORT}`);
  });
}

start();
