-- Formatting. conform.nvim owns it; this file only fills the gaps.
--
-- The `lang.typescript.oxc` extra (enabled in lazyvim.json) already appends
-- oxfmt to conform for js/jsx/ts/tsx/json/jsonc/vue/svelte/astro, installs it
-- via mason, and registers oxlint as an LSP server. Do NOT restate those
-- mappings here -- that extra uses table.insert, so a duplicate mapping yields
-- { "oxfmt", "oxfmt" } and formats twice.
--
-- So this file covers only what oxfmt does not handle: the CSS family, YAML,
-- GraphQL, HTML, and markdown. Revisit as oxfmt's coverage grows.
-- https://oxc.rs/docs/guide/usage/formatter/editors.html#neovim
return {
  {
    "stevearc/conform.nvim",
    opts = {
      formatters_by_ft = {
        css = { "prettier" },
        scss = { "prettier" },
        less = { "prettier" },
        html = { "prettier" },
        yaml = { "prettier" },
        graphql = { "prettier" },

        -- prettierd is a daemon; markdown formats often enough to justify it
        markdown = { "prettierd", "prettier", stop_after_first = true },
        ["markdown.mdx"] = { "prettierd", "prettier", stop_after_first = true },
      },
    },
  },
  {
    "mason-org/mason.nvim",
    opts = { ensure_installed = { "prettier", "prettierd" } },
  },
}
