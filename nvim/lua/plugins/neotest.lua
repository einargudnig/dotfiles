return {
  -- Core
  {
    "nvim-neotest/neotest",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-treesitter/nvim-treesitter",
      "antoinemadec/FixCursorHold.nvim",
      -- adapters
      "nvim-neotest/neotest-vim-test",
      "nvim-neotest/neotest-jest", -- optional (Jest fallback)
      "marilari88/neotest-vitest",
    },
    config = function()
      local neotest = require("neotest")

      neotest.setup({
        adapters = {
          -- Vitest adapter
          require("neotest-vitest")({
            -- Optional: customize vitest command or cwd detection
            -- vitestCommand = "vitest", -- or "pnpm vitest" / "yarn vitest" / "npx vitest"
            -- filter_dir = function(name, rel_path, root) return true end,
            -- is_test_file = function(file_path) return file_path:match(".*%.test%.[tj]sx?$") end,
          }),

          -- Optional: Jest as fallback for repos that use it
          -- require("neotest-jest")({
          --   jestCommand = "npm test --",
          --   jestConfigFile = "jest.config.ts",
          --   env = { CI = true },
          --   cwd = function(path) return vim.fn.getcwd() end,
          -- }),
        },

        -- General UI/options
        discovery = { enabled = true },
        running = { concurrent = true },
        summary = { open = "botright vsplit | vertical resize 50" },
        output = { open_on_run = true },
        quickfix = { enabled = false, open = false },
        diagnostic = { enabled = true },
      })

      -- Keymaps (LazyVim-style)
      local map = function(mode, lhs, rhs, desc)
        vim.keymap.set(mode, lhs, rhs, { desc = "Tests: " .. desc })
      end

      map("n", "<leader>tt", function()
        neotest.run.run()
      end, "Run nearest")
      map("n", "<leader>tf", function()
        neotest.run.run(vim.fn.expand("%"))
      end, "Run file")
      map("n", "<leader>ta", function()
        neotest.run.run({ suite = true })
      end, "Run all")
      map("n", "<leader>tl", function()
        neotest.run.run_last()
      end, "Run last")
      map("n", "<leader>ts", function()
        neotest.summary.toggle()
      end, "Toggle summary")
      map("n", "<leader>to", function()
        neotest.output.open({ enter = true })
      end, "Open output")
      map("n", "<leader>tO", function()
        neotest.output_panel.toggle()
      end, "Toggle output panel")
      map("n", "<leader>td", function()
        neotest.run.run({ strategy = "dap" })
      end, "Debug nearest")
      map("n", "<leader>tS", function()
        neotest.stop()
      end, "Stop")
    end,
  },
}
