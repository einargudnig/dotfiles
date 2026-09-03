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
      formatters = {
        ["markdown-toc"] = {
          condition = function(_, ctx)
            for _, line in ipairs(vim.api.nvim_buf_get_lines(ctx.buf, 0, -1, false)) do
              if line:find("<!%-%- toc %-%->") then
                return true
              end
            end
          end,
        },
        ["markdownlint-cli2"] = {
          condition = function(_, ctx)
            local diag = vim.tbl_filter(function(d)
              return d.source == "markdownlint"
            end, vim.diagnostic.get(ctx.buf))
            return #diag > 0
          end,
        },
      },
      formatters_by_ft = {
        css = { "prettier" },
        scss = { "prettier" },
        less = { "prettier" },
        html = { "prettier" },
        yaml = { "prettier" },
        graphql = { "prettier" },

        -- prettierd is a daemon; markdown formats often enough to justify it.
        -- markdownlint-cli2 fixes lint issues and markdown-toc updates the TOC
        -- when a `<!-- toc -->` marker exists.
        markdown = { "prettierd", "prettier", "markdownlint-cli2", "markdown-toc", stop_after_first = false },
        ["markdown.mdx"] = { "prettierd", "prettier", "markdownlint-cli2", "markdown-toc", stop_after_first = false },
      },
    },
  },
  {
    "mason-org/mason.nvim",
    opts = { ensure_installed = { "prettier", "prettierd", "markdown-toc" } },
  },
}
