return {
  -- Cursor line number changes color with Vim mode.
  {
    "mawkler/modicator.nvim",
    event = "VeryLazy",
    init = function()
      -- Modicator needs these three options to be enabled.
      vim.o.termguicolors = true
      vim.o.cursorline = true
      vim.o.number = true
    end,
    opts = {
      show_warnings = false,
      highlights = {
        defaults = {
          bold = false,
          italic = false,
        },
        use_cursorline_background = false,
      },
      integration = {
        lualine = {
          enabled = true,
          highlight = "bg",
        },
      },
    },
  },

  -- Rich virtual-text counters for /? search matches.
  {
    "kevinhwang91/nvim-hlslens",
    event = "VeryLazy",
    opts = {
      calm_down = true,
      nearest_only = false,
      nearest_float_when = "auto",
    },
    config = function(_, opts)
      require("hlslens").setup(opts)

      local function search_and_lens(cmd)
        return function()
          vim.cmd("normal! " .. vim.v.count1 .. cmd)
          vim.cmd("normal! zv")
          require("hlslens").start()
        end
      end

      local kopts = { noremap = true, silent = true }
      vim.keymap.set("n", "n", search_and_lens("n"), kopts)
      vim.keymap.set("n", "N", search_and_lens("N"), kopts)
      vim.keymap.set("n", "*", search_and_lens("*"), kopts)
      vim.keymap.set("n", "#", search_and_lens("#"), kopts)
      vim.keymap.set("n", "g*", search_and_lens("g*"), kopts)
      vim.keymap.set("n", "g#", search_and_lens("g#"), kopts)
    end,
  },

  -- Insert/delete smart log statements.
  {
    "chrisgrieser/nvim-chainsaw",
    event = "VeryLazy",
    opts = {
      marker = "🪚",
      visuals = {
        lineHlgroup = false,
      },
    },
    keys = {
      { "<leader>Cv", function() require("chainsaw").variableLog() end, mode = { "n", "x" }, desc = "Chainsaw: log variable" },
      { "<leader>Co", function() require("chainsaw").objectLog() end, mode = { "n", "x" }, desc = "Chainsaw: log object" },
      { "<leader>Ct", function() require("chainsaw").typeLog() end, mode = { "n", "x" }, desc = "Chainsaw: log type" },
      { "<leader>Cm", function() require("chainsaw").messageLog() end, desc = "Chainsaw: log message" },
      { "<leader>Ce", function() require("chainsaw").emojiLog() end, desc = "Chainsaw: emoji log" },
      { "<leader>CT", function() require("chainsaw").timeLog() end, desc = "Chainsaw: time log" },
      { "<leader>Cd", function() require("chainsaw").debugLog() end, desc = "Chainsaw: debugger" },
      { "<leader>Cs", function() require("chainsaw").stacktraceLog() end, desc = "Chainsaw: stacktrace" },
      { "<leader>Cr", function() require("chainsaw").removeLogs() end, mode = { "n", "x" }, desc = "Chainsaw: remove logs" },
      {
        "<leader>fL",
        function()
          local marker = require("chainsaw.config.config").config.marker
          Snacks.picker.grep_word({
            title = marker .. " log statements",
            search = marker,
            regex = false,
            live = false,
          })
        end,
        desc = "Chainsaw: find log statements",
      },
    },
  },

  -- Tab out of pairs/quotes/brackets.
  {
    "abecodes/tabout.nvim",
    event = "InsertCharPre",
    priority = 1000,
    opts = {
      tabkey = "<Tab>",
      backwards_tabkey = "<S-Tab>",
      act_as_tab = true,
      act_as_shift_tab = false,
      enable_backwards = true,
      completion = false,
      tabouts = {
        { open = "'", close = "'" },
        { open = '"', close = '"' },
        { open = "`", close = "`" },
        { open = "(", close = ")" },
        { open = "[", close = "]" },
        { open = "{", close = "}" },
      },
      ignore_beginning = true,
      exclude = {},
    },
  },

  -- Auto-close and auto-rename HTML/JSX/etc tags.
  {
    "windwp/nvim-ts-autotag",
    event = "LazyFile",
    opts = {
      opts = {
        enable_close = true,
        enable_rename = true,
        enable_close_on_slash = true,
      },
    },
  },

  -- Rainbow parentheses / brackets / tags via treesitter.
  {
    "HiPhish/rainbow-delimiters.nvim",
    event = "LazyFile",
    main = "rainbow-delimiters.setup",
    opts = {},
  },
}
