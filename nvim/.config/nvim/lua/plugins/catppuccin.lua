return {
  {
    "LazyVim/LazyVim",
    opts = {
      colorscheme = "catppuccin",
    },
  },

  -- Catppuccin theme
  {
    "catppuccin/nvim",
    lazy = false, -- load immediately
    priority = 1000, -- ensure it runs before other UI plugins
    name = "catppuccin",
    opts = {
      flavour = "mocha", -- or "macchiato", "frappe", "latte"
      background = { -- optional: match light/dark backgrounds
        light = "latte",
        dark = "mocha",
      },
      integrations = {
        aerial = true,
        alpha = true,
        cmp = true,
        flash = true,
        fzf = true,
        grug_far = true,
        gitsigns = true,
        headlines = true,
        illuminate = true,
        indent_blankline = { enabled = true },
        leap = true,
        lsp_trouble = true,
        mason = true,
        markdown = true,
        mini = true,
        native_lsp = {
          enabled = true,
          underlines = {
            errors = { "undercurl" },
            hints = { "undercurl" },
            warnings = { "undercurl" },
            information = { "undercurl" },
          },
        },
        navic = { enabled = true, custom_bg = "lualine" },
        neotest = true,
        neotree = true,
        noice = true,
        notify = true,
        semantic_tokens = true,
        snacks = true,
        treesitter = true,
        treesitter_context = true,
        which_key = true,
      },
      transparent_background = false, -- set true if you want transparency
      term_colors = true, -- propagate to :terminal
      styles = { -- optional style presets
        comments = { "italic" },
        conditionals = { "italic" },
        loops = {},
        functions = {},
        keywords = {},
        strings = {},
        variables = {},
        numbers = {},
        booleans = {},
        properties = {},
        types = {},
        operators = {},
      },
      color_overrides = {}, -- per-flavor overrides if needed
      custom_highlights = {}, -- global highlight overrides
    },
  },

}
