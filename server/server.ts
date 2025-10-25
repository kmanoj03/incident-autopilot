import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import incidentsRoute from "./routes/incidentRoute";
import diagnoseRoute from "./routes/diagnoseRoute";

dotenv.config();

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

app.listen(PORT, () => {
  console.log(`⚡ Server running at http://localhost:${PORT}`);
});
