#!/usr/bin/env node
/**
 * harness-metrics.js
 * Computes efficacy metrics for the Continual Harness — analogous to the
 * "cumulative button presses to milestone" metric from the paper.
 *
 * Reads: .pocket_harness/session-metrics.json, .pocket_harness/trajectory.jsonl,
 *        .pocket_harness/failures.json
 *
 * Outputs a dashboard with:
 * - Trend: tool calls per session over time
 * - Error rate trend
 * - Most frequently failing tools
 * - Harness component versions (hash diffs over time)
 * - Refinement effectiveness score
 *
 * Usage:
 *   node .github/scripts/harness-metrics.js              # print dashboard
 *   node .github/scripts/harness-metrics.js --json       # JSON output
 *   node .github/scripts/harness-metrics.js --trends     # trend analysis only
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const REPO_ROOT = resolve(process.cwd());
const HARNESS_DIR = join(REPO_ROOT, ".pocket_harness");
const METRICS_FILE = join(HARNESS_DIR, "session-metrics.json");
const TRAJECTORY_FILE = join(HARNESS_DIR, "trajectory.jsonl");
const FAILURES_FILE = join(HARNESS_DIR, "failures.json");
const HISTORY_FILE = join(HARNESS_DIR, "metrics-history.jsonl");
const AGENTS_FILE = join(REPO_ROOT, "AGENTS.md");

// ── Data Readers ──────────────────────────────────────────────────────

function readJSON(file) {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

function readTrajectory() {
  if (!existsSync(TRAJECTORY_FILE)) return [];
  const raw = readFileSync(TRAJECTORY_FILE, "utf-8").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function readHistory() {
  if (!existsSync(HISTORY_FILE)) return [];
  const raw = readFileSync(HISTORY_FILE, "utf-8").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function sha256(s) {
  return createHash("sha256").update(s).digest("hex").slice(0, 12);
}

// ── Metric Computations ───────────────────────────────────────────────

function computeCurrentMetrics() {
  const metrics = readJSON(METRICS_FILE) || {
    totalToolCalls: 0,
    sessions: 1,
    failures: 0,
  };
  const trajectory = readTrajectory();
  const failures = readJSON(FAILURES_FILE);

  // Tool type distribution
  const toolDist = {};
  for (const e of trajectory) {
    toolDist[e.tool] = (toolDist[e.tool] || 0) + 1;
  }

  // Top failing tools
  const failTools = {};
  for (const e of trajectory) {
    if (e.hasError) {
      failTools[e.tool] = (failTools[e.tool] || 0) + 1;
    }
  }
  const topFailing = Object.entries(failTools)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Error rate
  const errorRate =
    trajectory.length > 0
      ? (
          (trajectory.filter((e) => e.hasError).length / trajectory.length) *
          100
        ).toFixed(1)
      : "0.0";

  // File touch diversity (how many unique files were edited)
  const editTools = [
    "replace_string_in_file",
    "edit_file",
    "multi_replace_string_in_file",
    "create_file",
  ];
  const uniqueEditedFiles = new Set(
    trajectory
      .filter(
        (e) =>
          editTools.includes(e.tool) && e.input && e.input !== "(no input)",
      )
      .map((e) => e.input),
  );

  // AGENTS.md hash (to track prompt refinements)
  const agentsHash = existsSync(AGENTS_FILE)
    ? sha256(readFileSync(AGENTS_FILE, "utf-8"))
    : "N/A";

  // Failure severity distribution
  const failureSeverity = { high: 0, medium: 0, low: 0 };
  if (failures && failures.failures) {
    for (const f of failures.failures) {
      failureSeverity[f.severity] = (failureSeverity[f.severity] || 0) + 1;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalToolCalls: metrics.totalToolCalls,
      sessions: metrics.sessions,
      totalFailures: metrics.failures,
      currentErrorRate: `${errorRate}%`,
      uniqueFilesEdited: uniqueEditedFiles.size,
    },
    toolDistribution: toolDist,
    topFailingTools: topFailing.map(([tool, count]) => ({
      tool,
      failures: count,
    })),
    harnessState: {
      agentsMdHash: agentsHash,
      failureSeverity,
    },
  };
}

function computeTrends() {
  const history = readHistory();
  const current = computeCurrentMetrics();

  // Append current snapshot to history
  const snapshot = {
    ts: new Date().toISOString(),
    totalToolCalls: current.summary.totalToolCalls,
    sessions: current.summary.sessions,
    failures: current.summary.totalFailures,
    errorRate: parseFloat(current.summary.currentErrorRate),
    uniqueFiles: current.summary.uniqueFilesEdited,
    agentsHash: current.harnessState.agentsMdHash,
  };
  history.push(snapshot);

  // Keep last 100 snapshots
  const trimmed = history.slice(-100);
  writeFileSync(
    HISTORY_FILE,
    trimmed.map((e) => JSON.stringify(e)).join("\n") + "\n",
  );

  // Compute trends
  const trends = {
    snapshots: trimmed.length,
    firstSnapshot: trimmed[0]?.ts,
    lastSnapshot: trimmed[trimmed.length - 1]?.ts,
  };

  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];

    // Tool calls per session trend
    const callsPerSessionFirst =
      first.sessions > 0 ? first.totalToolCalls / first.sessions : 0;
    const callsPerSessionLast =
      last.sessions > 0 ? last.totalToolCalls / last.sessions : 0;
    trends.callsPerSession = {
      initial: callsPerSessionFirst.toFixed(0),
      current: callsPerSessionLast.toFixed(0),
      delta: (callsPerSessionLast - callsPerSessionFirst).toFixed(0),
      trend:
        callsPerSessionLast < callsPerSessionFirst
          ? "improving"
          : callsPerSessionLast > callsPerSessionFirst
            ? "degrading"
            : "stable",
    };

    // Error rate trend
    trends.errorRate = {
      initial: `${first.errorRate?.toFixed(1) || "0.0"}%`,
      current: `${last.errorRate?.toFixed(1) || "0.0"}%`,
      delta: `${((last.errorRate || 0) - (first.errorRate || 0)).toFixed(1)}pp`,
      trend:
        (last.errorRate || 0) < (first.errorRate || 0)
          ? "improving"
          : (last.errorRate || 0) > (first.errorRate || 0)
            ? "degrading"
            : "stable",
    };

    // Prompt refinement count (hash changes)
    const hashChanges = trimmed.filter(
      (s, i) => i > 0 && s.agentsHash !== trimmed[i - 1].agentsHash,
    ).length;
    trends.promptRefinements = hashChanges;
  }

  return { current, trends };
}

// ── Display ───────────────────────────────────────────────────────────

function printDashboard({ current, trends }) {
  const s = current.summary;
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║         CONTINUAL HARNESS — EFFICACY DASHBOARD       ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(
    `║  Total tool calls     │ ${String(s.totalToolCalls).padStart(8)}                    ║`,
  );
  console.log(
    `║  Sessions recorded    │ ${String(s.sessions).padStart(8)}                    ║`,
  );
  console.log(
    `║  Total failures       │ ${String(s.totalFailures).padStart(8)}                    ║`,
  );
  console.log(
    `║  Current error rate   │ ${s.currentErrorRate.padStart(8)}                    ║`,
  );
  console.log(
    `║  Unique files edited  │ ${String(s.uniqueFilesEdited).padStart(8)}                    ║`,
  );
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(
    `║  AGENTS.md hash       │ ${current.harnessState.agentsMdHash}                       ║`,
  );
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║  Failure severity distribution:                      ║");
  console.log(
    `║    High: ${current.harnessState.failureSeverity.high}  Medium: ${current.harnessState.failureSeverity.medium}  Low: ${current.harnessState.failureSeverity.low}                             ║`,
  );
  console.log("╠══════════════════════════════════════════════════════╣");

  if (current.topFailingTools.length > 0) {
    console.log("║  Top failing tools:                                  ║");
    for (const { tool, failures } of current.topFailingTools) {
      console.log(
        `║    ${tool.padEnd(30)} ${String(failures).padStart(4)} failures  ║`,
      );
    }
  } else {
    console.log("║  No tool failures detected.                          ║");
  }

  if (trends.snapshots >= 2) {
    console.log("╠══════════════════════════════════════════════════════╣");
    console.log("║  TRENDS (over last ~N sessions):                     ║");
    console.log(
      `║  Calls/session: ${trends.callsPerSession?.initial} → ${trends.callsPerSession?.current} (${trends.callsPerSession?.trend})              ║`,
    );
    console.log(
      `║  Error rate:    ${trends.errorRate?.initial} → ${trends.errorRate?.current} (${trends.errorRate?.trend})              ║`,
    );
    console.log(
      `║  Prompt refinements: ${trends.promptRefinements || 0}                               ║`,
    );
  }

  console.log("╚══════════════════════════════════════════════════════╝");
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const trendsOnly = args.includes("--trends");

  const data = computeTrends();

  if (asJson) {
    console.log(JSON.stringify(trendsOnly ? data.trends : data, null, 2));
  } else if (trendsOnly) {
    console.log(JSON.stringify(data.trends, null, 2));
  } else {
    printDashboard(data);
  }

  process.exit(0);
}

main();
