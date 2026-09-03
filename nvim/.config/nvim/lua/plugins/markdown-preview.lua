-- Browser-based markdown preview.
--
-- This complements markview.nvim (in-editor rendering) by opening the file in
-- your default browser. Both can be used at the same time.
return {
  "iamcco/markdown-preview.nvim",
  cmd = { "MarkdownPreviewToggle", "MarkdownPreview", "MarkdownPreviewStop" },
  ft = { "markdown" },
  build = function()
    vim.fn["mkdp#util#install"]()
  end,
  init = function()
    vim.g.mkdp_filetypes = { "markdown" }
    -- Match the dark Catppuccin theme in the browser preview.
    vim.g.mkdp_theme = "dark"
    -- Auto-close the browser tab when leaving markdown buffer.
    vim.g.mkdp_auto_close = 1
  end,
}
