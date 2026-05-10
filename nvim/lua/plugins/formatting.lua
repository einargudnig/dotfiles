-- Use prettier (via prettierd daemon) as the sole markdown formatter.
-- Overrides LazyVim's `lang.markdown` extra, which chains
-- prettier -> markdownlint-cli2 -> markdown-toc.
return {
  {
    "stevearc/conform.nvim",
    opts = {
      formatters_by_ft = {
        markdown = { "prettierd", "prettier", stop_after_first = true },
        ["markdown.mdx"] = { "prettierd", "prettier", stop_after_first = true },
      },
    },
  },
  {
    "mason-org/mason.nvim",
    opts = { ensure_installed = { "prettierd" } },
  },
}
