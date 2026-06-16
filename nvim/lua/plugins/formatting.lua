-- Use prettier (via prettierd daemon) as the sole markdown formatter.
-- Overrides LazyVim's `lang.markdown` extra, which chains
-- prettier -> markdownlint-cli2 -> markdown-toc.
--
-- Use oxc's formatter (oxfmt) for JS/TS/JSON/Vue. conform's bundled
-- `oxfmt` formatter resolves the binary from node_modules/.bin and
-- falls back to the global `oxfmt` on PATH. Install: `npm i -g oxfmt`.
-- https://oxc.rs/docs/guide/usage/formatter/editors.html#neovim
return {
  {
    "stevearc/conform.nvim",
    opts = {
      formatters_by_ft = {
        markdown = { "prettierd", "prettier", stop_after_first = true },
        ["markdown.mdx"] = { "prettierd", "prettier", stop_after_first = true },
        javascript = { "oxfmt" },
        javascriptreact = { "oxfmt" },
        typescript = { "oxfmt" },
        typescriptreact = { "oxfmt" },
        json = { "oxfmt" },
        jsonc = { "oxfmt" },
        vue = { "oxfmt" },
      },
    },
  },
  {
    "mason-org/mason.nvim",
    opts = { ensure_installed = { "prettierd" } },
  },
  -- The `formatting.prettier` extra also registers prettier as a none-ls
  -- source at priority 200, which outranks conform (100) and shadows ALL of
  -- conform's mappings above (oxfmt, prettierd). Drop the none-ls prettier
  -- source so conform owns JS/TS/JSON/Vue/markdown/etc; none-ls keeps stylua,
  -- shfmt, fish, hadolint. Prettier-only filetypes (css/yaml/html/graphql)
  -- still format via conform's prettier mapping from the same extra.
  {
    "nvimtools/none-ls.nvim",
    opts = function(_, opts)
      opts.sources = vim.tbl_filter(function(source)
        return source.name ~= "prettier"
      end, opts.sources or {})
    end,
  },
}
