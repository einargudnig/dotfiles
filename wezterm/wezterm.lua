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
	font_size = 16.0,
	-- font = wezterm.font("JetBrains Mono"),
	font = wezterm.font("Geist Mono"),
	-- macos_window_background_blur = 40,
	macos_window_background_blur = 30,
	max_fps = 240,
	animation_fps = 10,

	window_background_opacity = 1.0,
	-- window_background_opacity = 0.78,
	-- window_background_opacity = 0.20,
	window_decorations = "RESIZE",
	-- keys = {
	-- 	k.cmd_key(".", k.multiple_actions(":ZenMode")),
	-- 	{
	-- 		key = "f",
	-- 		mods = "CTRL",
	-- 		action = wezterm.action.ToggleFullScreen,
	-- 	},
	-- 	{
	-- 		key = "'",
	-- 		mods = "CTRL",
	-- 		action = wezterm.action.ClearScrollback("ScrollbackAndViewport"),
	-- 	},
	--
	-- k.cmd_key(
	-- 	"s",
	-- 	act.Multiple({
	-- 		act.SendKey({ key = "\x1b" }), -- escape
	-- 		k.multiple_actions(":w"),
	-- 	})
	-- ),
	-- },

	mouse_bindings = {
		-- Ctrl-click will open the link under the mouse cursor
		{
			event = { Up = { streak = 1, button = "Left" } },
			mods = "CTRL",
			action = wezterm.action.OpenLinkAtMouseCursor,
		},
	},
}
