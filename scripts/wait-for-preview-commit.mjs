#!/usr/bin/env node
/**
 * Polls a Vercel preview until /api/health reports this commit.
 * Older aliases keep serving the previous deployment while the new build runs.
 */
const previewUrl = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "");
const expectedSha = process.env.EXPECTED_SHA?.trim();
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
const timeoutMs = Number(process.env.PREVIEW_WAIT_TIMEOUT_MS ?? 8 * 60 * 1000);
const intervalMs = Number(process.env.PREVIEW_WAIT_INTERVAL_MS ?? 10_000);

if (!previewUrl || !expectedSha) {
  console.error(
    JSON.stringify({
      status: "error",
      reason: "PLAYWRIGHT_BASE_URL and EXPECTED_SHA are required",
    }),
  );
  process.exit(1);
}

const headers = { Accept: "application/json" };
if (bypass) {
  headers["x-vercel-protection-bypass"] = bypass;
}

const deadline = Date.now() + timeoutMs;

while (Date.now() < deadline) {
  try {
    const response = await fetch(`${previewUrl}/api/health`, { headers });
    const body = await response.json();
    const commit = typeof body.commit === "string" ? body.commit : null;

    if (
      response.ok &&
      commit &&
      commit.toLowerCase() === expectedSha.toLowerCase()
    ) {
      console.log(
        JSON.stringify({
          status: "ready",
          commit,
          url: previewUrl,
        }),
      );
      process.exit(0);
    }

    console.log(
      JSON.stringify({
        status: "waiting",
        http: response.status,
        commit,
        expected: expectedSha,
      }),
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        status: "waiting",
        error: error instanceof Error ? error.message : "request failed",
        expected: expectedSha,
      }),
    );
  }

  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}

console.error(
  JSON.stringify({
    status: "timeout",
    expected: expectedSha,
    url: previewUrl,
    reason:
      "Preview did not serve this commit. Check the Vercel deployment for this SHA.",
  }),
);
process.exit(1);
