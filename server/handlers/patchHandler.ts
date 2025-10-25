import { Request, Response } from "express";
import fs from "fs";

export function applyPatch(req: Request, res: Response) {
  try {
    const { targetFilePath, finalPatchDiff } = req.body || {};

    if (!targetFilePath || !finalPatchDiff) {
      return res
        .status(400)
        .json({ error: "targetFilePath and finalPatchDiff are required" });
    }

    // For test purpose only —> not using the actual demo
    console.log("🧩 Applying patch stub:");
    console.log("File:", targetFilePath);
    console.log("Diff:\n", finalPatchDiff);

    // Optionally simulate a file save
    fs.writeFileSync(
      "./applied_patches.log",
      `\n[${new Date().toISOString()}] PATCH -> ${targetFilePath}\n${finalPatchDiff}\n`,
      { flag: "a" }
    );

    return res.status(200).json({
      status: "applied_locally_stub",
      note: "✅ Patch logged locally. In production, this step would trigger Composio → GitHub to open a hotfix PR.",
    });
  } catch (err) {
    console.error("applyPatch error:", err);
    res.status(500).json({ error: "internal_error" });
  }
}
