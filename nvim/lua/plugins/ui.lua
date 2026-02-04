return {
  -- messages, cmdline and the popupmenu
  {
    "folke/noice.nvim",
    opts = function(_, opts)
      -- Disable cmdline takeover (fixes crash on Neovim 0.11.5)
      opts.cmdline = { enabled = true }
      opts.messages = { enabled = true }
      opts.popupmenu = { enabled = false }
      table.insert(opts.routes, {
        filter = {
          event = "notify",
          find = "No information available",
        },
        opts = { skip = true },
      })
      local focused = true
      vim.api.nvim_create_autocmd("FocusGained", {
        callback = function()
          focused = true
        end,
      })
      vim.api.nvim_create_autocmd("FocusLost", {
        callback = function()
          focused = false
        end,
      })
      table.insert(opts.routes, 1, {
        filter = {
          cond = function()
            return not focused
          end,
        },
        view = "notify_send",
        opts = { stop = false },
      })

      opts.commands = {
        all = {
          -- options for the message history that you get with `:Noice`
          view = "split",
          opts = { enter = true, format = "details" },
          filter = {},
        },
      }

      vim.api.nvim_create_autocmd("FileType", {
        pattern = "markdown",
        callback = function(event)
          vim.schedule(function()
            require("noice.text.markdown").keys(event.buf)
          end)
        end,
      })

      opts.presets.lsp_doc_border = true
    end,
  },
  -- making notifications stay a bit longer plz
  {
    "rcarriga/nvim-notify",
    opts = {
      timeout = 10000,
    },
  },
  -- filenames
  {
    "b0o/incline.nvim",
    dependencies = { "craftzdog/solarized-osaka.nvim" },
    event = "BufReadPre",
    priority = 1200,
    config = function()
      local colors = require("solarized-osaka.colors").setup()
      require("incline").setup({
        highlight = {
          groups = {
            InclineNormal = { guibg = colors.magenta500, guifg = colors.base04 },
            InclineNormalNC = { guifg = colors.violet500, guibg = colors.base03 },
          },
        },
        window = { margin = { vertical = 0, horizontal = 1 } },
        hide = {
          cursorline = true,
        },
        render = function(props)
          local filename = vim.fn.fnamemodify(vim.api.nvim_buf_get_name(props.buf), ":t")
          if vim.bo[props.buf].modified then
            filename = "[+] " .. filename
          end

          local icon, color = require("nvim-web-devicons").get_icon_color(filename)
          return { { icon, guifg = color }, { " " }, { filename } }
        end,
      })
    end,
  },

  -- buffer line (disabled)
  { "akinsho/bufferline.nvim", enabled = false },

  -- statusline
  {
    "nvim-lualine/lualine.nvim",
    opts = function(_, opts)
      table.insert(opts.sections.lualine_c, {
        function()
          return " "
        end,
        color = function()
          local ok, sk = pcall(require, "sidekick.status")
          local status = ok and sk.get() or nil
          if status then
            return status.kind == "Error" and "DiagnosticError" or status.busy and "DiagnosticWarn" or "Special"
          end
        end,
        cond = function()
          local ok, status = pcall(require, "sidekick.status")
          return ok and status.get() ~= nil
        end,
      })
    end,
  },

  -- improved icons
  {
    "mskelton/termicons.nvim",
    requires = { "nvim-tree/nvim-web-devicons" },
    build = false,
  },

  -- tiny inline diagnostics
  -- {
  --   "rachartier/tiny-inline-diagnostic.nvim",
  --   event = "VeryLazy",
  --   priority = 1000,
  --   opts = {},
  -- },
  -- {
  --   "neovim/nvim-lspconfig",
  --   opts = { diagnostics = { virtual_text = false } },
  -- },
}
