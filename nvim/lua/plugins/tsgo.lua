-- Use the native TypeScript 7 language server (tsgo) instead of vtsls.
-- Requires a global tsgo:  npm i -g @typescript/native-preview
--
-- LazyVim's server loop routes `tsgo` through mason (which doesn't manage it),
-- so it never calls vim.lsp.enable. We therefore define + enable tsgo ourselves
-- in the opts hook, and just disable vtsls through LazyVim's normal mechanism.
return {
  {
    "neovim/nvim-lspconfig",
    opts = function(_, opts)
      opts.servers = opts.servers or {}
      opts.servers.vtsls = { enabled = false }

      vim.lsp.config("tsgo", {
        cmd = { "tsgo", "--lsp", "--stdio" },
        filetypes = {
          "javascript",
          "javascriptreact",
          "javascript.jsx",
          "typescript",
          "typescriptreact",
          "typescript.tsx",
        },
        root_markers = { "tsconfig.json", "jsconfig.json", "package.json", ".git" },
      })
      vim.lsp.enable("tsgo")
    end,
  },
}
