-- Markdown rendering.
--
-- Replaced MeanderingProgrammer/render-markdown.nvim, whose config (custom
-- Headline*Bg highlight groups, heading icons, code block styling) lived here
-- commented out for a long time. Recover it from git history if ever needed.
return {
  "OXY2DEV/markview.nvim",
  lazy = false,
  opts = {
    preview = {
      -- Render in normal, operator-pending, command and insert modes.
      modes = { "n", "no", "c", "i" },
      -- In insert mode show the raw text around the cursor so you can edit
      -- without the preview getting in the way.
      hybrid_modes = { "i" },
      linewise_hybrid_mode = true,
      edit_range = { 0, 0 },

      -- Use nvim-web-devicons for the language label on code blocks.
      icon_provider = "devicons",

      -- Attach to these filetypes.
      filetypes = { "markdown", "quarto", "rmd" },

      -- Let markview own `gx` for links, headings and images.
      map_gx = true,
    },

    markdown = {
      code_blocks = {
        -- Draw a bordered block with the language label on the right.
        style = "block",
        sign = true,
        label_direction = "right",
      },

      list_items = {
        marker_minus = { text = "●" },
        marker_plus = { text = "◈" },
        marker_star = { text = "◇" },
      },

      tables = {
        -- Draw full table borders above and below.
        block_decorator = true,
        use_virt_lines = false,
      },
    },

    markdown_inline = {
      inline_codes = {
        -- Pad inline code spans so they don't feel cramped.
        padding_left = " ",
        padding_right = " ",
      },
    },
  },
}
