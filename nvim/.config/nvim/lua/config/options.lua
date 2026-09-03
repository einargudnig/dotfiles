-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here

-- Treat .mdx files as markdown.mdx so markdown plugins attach to them.
vim.filetype.add({ extension = { mdx = "markdown.mdx" } })
