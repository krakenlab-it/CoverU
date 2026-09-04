#!/usr/bin/env node
/**
 * Discovers a Vercel preview deployment URL for the current PR.
 * Exits 0 with URL on stdout, 2 when not found, 3 when skipped (fork/missing token).
 */
const owner = process.env.GITHUB_REPOSITORY?.split("/")[0];
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const prNumber = process.env.PR_NUMBER;
const token = process.env.GITHUB_TOKEN;
const isFork = process.env.IS_FORK === "true";

if (isFork) {
  console.error(
    JSON.stringify({
      status: "skipped",
      reason: "fork PR — preview verification not available",
    }),
  );
  process.exit(3);
}

if (!owner || !repo || !prNumber || !token) {
  console.error(
    JSON.stringify({
      status: "skipped",
      reason: "missing GITHUB_REPOSITORY, PR_NUMBER, or GITHUB_TOKEN",
    }),
  );
  process.exit(3);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

async function fromDeployments() {
  const ref = `refs/pull/${prNumber}/merge`;
  const url = `https://api.github.com/repos/${owner}/${repo}/deployments?environment=Preview&ref=${encodeURIComponent(ref)}&per_page=5`;
  const response = await fetch(url, { headers });
  if (!response.ok) return null;

  const deployments = await response.json();
  for (const deployment of deployments) {
    const statusUrl = `https://api.github.com/repos/${owner}/${repo}/deployments/${deployment.id}/statuses?per_page=1`;
    const statusResponse = await fetch(statusUrl, { headers });
    if (!statusResponse.ok) continue;
    const statuses = await statusResponse.json();
    const active = statuses.find((s) => s.state === "success" && s.environment_url);
    if (active?.environment_url) {
      return active.environment_url.replace(/\/$/, "");
    }
  }
  return null;
}

async function fromComments() {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100`;
  const response = await fetch(url, { headers });
  if (!response.ok) return null;

  const comments = await response.json();
  const vercelPattern = /https:\/\/[a-z0-9-]+-[a-z0-9-]+\.vercel\.app/gi;

  for (const comment of comments.reverse()) {
    const body = comment.body ?? "";
    if (!/vercel/i.test(body)) continue;
    const matches = body.match(vercelPattern);
    if (matches?.[0]) {
      return matches[0].replace(/\/$/, "");
    }
  }

  return null;
}

const previewUrl = (await fromDeployments()) ?? (await fromComments());

if (!previewUrl) {
  console.error(
    JSON.stringify({
      status: "not_found",
      reason: "No Vercel preview URL discovered yet",
    }),
  );
  process.exit(2);
}

console.log(previewUrl);
