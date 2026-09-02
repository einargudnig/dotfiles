/**
 * Context Status Footer Extension
 *
 * Shows context window usage in the footer with:
 * - Visual progress bar for context consumption
 * - Percentage and token counts
 * - Current model and git branch
 *
 * The bar changes color as context fills up:
 *   green < 50% → yellow < 75% → red ≥ 75%
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

function contextBar(percent: number, width: number): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    if (!ctx.hasUI) return;

    ctx.ui.setFooter((tui, theme, footerData) => {
      // Re-render when git branch changes
      const unsub = footerData.onBranchChange(() => tui.requestRender());

      return {
        dispose: unsub,
        invalidate() {},
        render(width: number): string[] {
          const usage = ctx.getContextUsage();
          const model = ctx.model?.id ?? "—";
          const branch = footerData.getGitBranch();

          // Left side: context bar
          let left: string;
          if (usage) {
            const pct = Math.round(usage.percent ?? 0);
            const barWidth = Math.min(12, Math.max(4, Math.floor(width * 0.15)));

            let barColor: "success" | "warning" | "error" | "dim";
            if (pct < 50) barColor = "success";
            else if (pct < 75) barColor = "warning";
            else barColor = "error";

            const bar = contextBar(pct, barWidth);
            const pctStr = `${pct}%`;
            const tokenStr = usage.contextWindow
              ? `${formatTokens(usage.tokens ?? 0)}/${formatTokens(usage.contextWindow)}`
              : `${formatTokens(usage.tokens ?? 0)}`;

            left =
              theme.fg(barColor, bar) +
              " " +
              theme.fg(barColor, theme.bold(pctStr)) +
              " " +
              theme.fg("dim", tokenStr);
          } else {
            left = theme.fg("dim", "ctx —");
          }

          // Right side: model + branch
          const branchStr = branch ? ` ${theme.fg("dim", `on ${branch}`)}` : "";
          const right = theme.fg("muted", model) + branchStr;

          // Pad and combine
          const leftW = visibleWidth(left);
          const rightW = visibleWidth(right);
          const pad = Math.max(1, width - leftW - rightW);

          return [truncateToWidth(left + " ".repeat(pad) + right, width)];
        },
      };
    });
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    ctx.ui.setFooter(undefined);
  });
}

function formatTokens(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
