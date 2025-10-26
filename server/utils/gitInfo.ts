import { execSync } from "child_process";

interface GitInfo {
  owner: string;
  repo: string;
  userName: string;
  userEmail: string;
}

/**
 * Extracts git repository information from the current workspace
 * - owner/repo from git remote origin
 * - user name/email from git config
 */
export function getGitInfo(): GitInfo {
  try {
    // Get remote origin URL
    // Examples:
    // - https://github.com/owner/repo.git
    // - git@github.com:owner/repo.git
    const remoteUrl = execSync("git remote get-url origin", {
      encoding: "utf-8",
    }).trim();

    // Extract owner and repo from URL
    let owner = "";
    let repo = "";

    // Match HTTPS format: https://github.com/owner/repo.git
    const httpsMatch = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)(?:\.git)?/);
    if (httpsMatch) {
      owner = httpsMatch[1];
      repo = httpsMatch[2].replace(/\.git$/, "");
    }

    // Get user info from git config
    const userName = execSync("git config user.name", {
      encoding: "utf-8",
    }).trim();

    const userEmail = execSync("git config user.email", {
      encoding: "utf-8",
    }).trim();

    if (!owner || !repo) {
      throw new Error("Could not parse owner/repo from git remote");
    }

    return {
      owner,
      repo,
      userName,
      userEmail,
    };
  } catch (err) {
    console.error("Error extracting git info:", err);
    throw new Error(
      "Failed to extract git info. Ensure you're in a git repository with a GitHub remote."
    );
  }
}

