-- Scroll Bar
local scrollbar = {
  color = {
    bar = "#00FF00",
    cursor = "#dddddd",
  },
}

return {
  "petertriho/nvim-scrollbar",
  enabled = true,
  config = function()
    require("scrollbar").setup({
      handle = {
        text = "█",
        color = scrollbar.color.bar,
      },
      marks = {
        Cursor = {
          text = "█",
          color = scrollbar.color.cursor,
        },
      },
    })
  end,
}
