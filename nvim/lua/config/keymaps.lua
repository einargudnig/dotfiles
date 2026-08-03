-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

local keymap = vim.keymap
local opts = { noremap = true, silent = true }

-- select all
keymap.set("n", "<C-a>", "gg<S-v>G")

-- Delete the word before the cursor. (Was `vb_d`, where the stray `_` jumped to
-- the first non-blank of the line, so it deleted everything from there to the
-- cursor rather than a single word.)
keymap.set("n", "dw", "vbd")

-- New tab
keymap.set("n", "te", ":tabedit")
-- <tab> is also claimed by sidekick.nvim, whose mapping falls through to
-- :tabnext when there is no edit suggestion, so both behaviours survive.
keymap.set("n", "<tab>", ":tabnext<Return>", opts)
keymap.set("n", "<s-tab>", ":tabprev<Return>", opts)
-- Split window
keymap.set("n", "ss", ":split<Return>", opts)
keymap.set("n", "sv", ":vsplit<Return>", opts)
-- Move window
keymap.set("n", "sh", "<C-w>h")
keymap.set("n", "sk", "<C-w>k")
keymap.set("n", "sj", "<C-w>j")
keymap.set("n", "sl", "<C-w>l")
-- Resize window
keymap.set("n", "<C-w><left>", "<C-w><")
keymap.set("n", "<C-w><right>", "<C-w>>")
keymap.set("n", "<C-w><up>", "<C-w>+")
keymap.set("n", "<C-w><down>", "<C-w>-")

-- escape insert mode with jk
keymap.set("i", "jk", "<ESC>", { silent = true })

-- oil
vim.keymap.set("n", "-", "<CMD>Oil --float<CR>", { desc = "Open parent directory" })
