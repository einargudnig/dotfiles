/**
 * Papercut Friction Capture Extension
 *
 * Auto-logs friction when:
 * - Tool calls fail or return errors
 * - Bash commands exit non-zero
 * - Agent retries after a failure
 *
 * Uses the `papercut` CLI to persist friction entries.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const execFileAsync = promisify(execFile);

// Tags for different friction types
const TAG = "tool";

// Dedup: track recent entries to avoid logging the same friction twice
const recentFrictions = new Map<string, number>();
const DEDUP_WINDOW_MS = 30_000; // 30s cooldown for same fingerprint

function fingerprint(toolName: string, errorSnippet: string): string {
  return `${toolName}:${errorSnippet.slice(0, 120)}`;
}

function isDuplicate(fp: string): boolean {
  const now = Date.now();
  const last = recentFrictions.get(fp);
  if (last && now - last < DEDUP_WINDOW_MS) return true;
  recentFrictions.set(fp, now);
  // Cleanup old entries
  if (recentFrictions.size > 100) {
    for (const [key, ts] of recentFrictions) {
      if (now - ts > DEDUP_WINDOW_MS) recentFrictions.delete(key);
    }
  }
  return false;
}

async function logPapercut(message: string, workaround?: string): Promise<void> {
  try {
    const args = ["papercut", message, "-t", TAG];
    if (workaround) args.push("-f", workaround);
    await execFileAsync("papercut", [message, "-t", TAG, ...(workaround ? ["-f", workaround] : [])], {
      timeout: 5000,
      env: { ...process.env, PATH: process.env.PATH },
    });
  } catch {
    // Silent fail — don't break the agent if papercut is unavailable
  }
}

export default function (pi: ExtensionAPI) {
  // Track tool calls so we can correlate failures
  const pendingToolCalls = new Map<string, { toolName: string; input: unknown }>();

  pi.on("tool_execution_start", async (event) => {
    pendingToolCalls.set(event.toolCallId, {
      toolName: event.toolName,
      input: event.args,
    });
  });

  pi.on("tool_execution_end", async (event) => {
    pendingToolCalls.delete(event.toolCallId);
  });

  pi.on("tool_result", async (event) => {
    if (!event.isError) return;

    const toolName = event.toolName;
    const input = pendingToolCalls.get(event.toolCallId)?.input ?? event.input;

    // Extract error text
    const errorText =
      event.content
        ?.filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("\n") ?? "";

    const snippet = errorText.slice(0, 200).replace(/\n/g, " ");
    const fp = fingerprint(toolName, snippet);

    if (isDuplicate(fp)) return;

    // Build a readable friction line
    let detail = `${toolName} failed`;
    if (toolName === "bash" && input && typeof input === "object" && "command" in input) {
      const cmd = String((input as { command: string }).command).slice(0, 100);
      detail = `bash: \`${cmd}\` failed`;
    } else if (toolName === "read" && input && typeof input === "object" && "path" in input) {
      detail = `read: ${String((input as { path: string }).path)} failed`;
    } else if (toolName === "edit" && input && typeof input === "object" && "path" in input) {
      detail = `edit: ${String((input as { path: string }).path)} failed`;
    } else if (toolName === "write" && input && typeof input === "object" && "path" in input) {
      detail = `write: ${String((input as { path: string }).path)} failed`;
    }

    const msg = `${detail} — ${snippet}`;
    await logPapercut(msg);
  });

  // Also catch bash non-zero exits from tool_result details
  pi.on("tool_result", async (event) => {
    if (event.toolName !== "bash") return;
    if (event.isError) return; // Already handled above

    // Check details for non-zero exit code
    const details = event.details as { exitCode?: number } | undefined;
    if (!details || details.exitCode === undefined || details.exitCode === 0) return;

    const output =
      event.content
        ?.filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("\n") ?? "";

    const cmd =
      event.input && typeof event.input === "object" && "command" in event.input
        ? String((event.input as { command: string }).command).slice(0, 100)
        : "unknown";

    const snippet = output.slice(0, 200).replace(/\n/g, " ");
    const fp = fingerprint("bash-exit", `${details.exitCode}:${cmd}:${snippet}`);

    if (isDuplicate(fp)) return;

    await logPapercut(
      `bash exited ${details.exitCode}: \`${cmd}\` — ${snippet}`,
    );
  });
}
