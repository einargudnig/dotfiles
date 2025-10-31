--
-- ██╗    ██╗███████╗███████╗████████╗███████╗██████╗ ███╗   ███╗
-- ██║    ██║██╔════╝╚══███╔╝╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
-- ██║ █╗ ██║█████╗    ███╔╝    ██║   █████╗  ██████╔╝██╔████╔██║
-- ██║███╗██║██╔══╝   ███╔╝     ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║
-- ╚███╔███╔╝███████╗███████╗   ██║   ███████╗██║  ██║██║ ╚═╝ ██║
--  ╚══╝╚══╝ ╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
-- A GPU-accelerated cross-platform terminal emulator
-- https://wezfurlong.org/wezterm/

-- Add the directory containing your config files to the package path
package.path = package.path .. ";/Users/einargudjonsson/.wezterm/?.lua"

local wezterm = require("wezterm")
-- local k = require("keys")
-- local act = wezterm.action

return {
	-- color_scheme = 'termnial.sexy',
	color_scheme = "Catppuccin Mocha",
	default_cursor_style = "BlinkingBar",
	enable_tab_bar = false,
	font_size = 24.0,
	-- font = wezterm.font("JetBrains Mono"),
	font = wezterm.font("Geist Mono"),
	line_height = 1.2,
	macos_window_background_blur = 30,
	window_background_opacity = 1.0,
	window_decorations = "RESIZE",
	window_padding = { left = "0.5cell", right = "0.5cell", top = "0.5cell", bottom = "0.5cell" },

	-- misc
	max_fps = 120,
	prefer_egl = true,
	animation_fps = 10,

	mouse_bindings = {
		-- Ctrl-click will open the link under the mouse cursor
		{
			event = { Up = { streak = 1, button = "Left" } },
			mods = "CTRL",
			action = wezterm.action.OpenLinkAtMouseCursor,
		},
	},

	keys = {
		-- Send "CTRL-A" to the terminal when pressing CTRL-A, CTRL-A
		{ key = "a", mods = "CTRL|CTRL", action = wezterm.action({ SendString = "\x01" }) },
		{ key = "Enter", mods = "SHIFT", action = wezterm.action({ SendString = "\x1b\r" }) },
	},
}
