local state = {
  floating = {
    buf = -1,
    win = -1,
  },
}

local function create_floating_window(opts)
  opts = opts or {}
  local width = opts.width or math.floor(vim.o.columns * 0.8)
  local height = opts.height or math.floor(vim.o.lines * 0.8)

  -- calculate the position to center the winsssssscccdddow
  local col = math.floor((vim.o.columns - width) / 2)
  local row = math.floor((vim.o.lines - height) / 2)

  -- create a buffer
  local buf = vim.api.nvim_create_buf(false, true) -- no file, scratch buffer

  -- define window configuration
  local win_config = {
    relative = "editor",
    width = width,
    height = height,
    col = col,
    row = row,
    style = "minimal", -- no borders or extra UI elements
    border = "rounded", -- rounded borders
  }

  -- create the floating window
  local win = vim.api.nvim_open_win(buf, true, win_config)

  return { buf = buf, win = win }
end

vim.api.nvim_create_user_command("Floaterminal", function()
  if not vim.api.nvim_win_is_valid(state.floating.win) then
    state.floating = create_floating_window()
  else
    vim.api.nvim_win_hide(state.floating.win)
  end
end, {})
