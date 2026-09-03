-- Make sure the parsers markview needs are installed.
return {
  "nvim-treesitter/nvim-treesitter",
  opts = function(_, opts)
    opts.ensure_installed = opts.ensure_installed or {}
    vim.list_extend(opts.ensure_installed, {
      "markdown",
      "markdown_inline",
      -- Uncomment if you write math in markdown.
      -- "latex",
    })
  end,
}
