-- Markdown tooling that would normally come from LazyVim's `lang.markdown`
-- extra, but we can't use that extra because it forces render-markdown.nvim
-- which fights markview.nvim.
return {
  -- Markdown LSP: wiki links, heading completion, go-to-definition for links.
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        marksman = {},
      },
    },
  },

  -- Lint markdown with markdownlint-cli2.
  {
    "mfussenegger/nvim-lint",
    optional = true,
    opts = {
      linters_by_ft = {
        markdown = { "markdownlint-cli2" },
      },
    },
  },

  -- Install the tools above via Mason.
  {
    "mason-org/mason.nvim",
    opts = { ensure_installed = { "marksman", "markdownlint-cli2" } },
  },
}
