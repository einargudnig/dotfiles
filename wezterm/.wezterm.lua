-- Pull in the wezterm API
local wezterm = require("wezterm")
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
	keys = {
		{
			key = "f",
			mods = "CTRL",
			action = wezterm.action.ToggleFullScreen,
		},
		{
			key = "'",
			mods = "CTRL",
			action = wezterm.action.ClearScrollback("ScrollbackAndViewport"),
		},
	},
	mouse_bindings = {
		-- Ctrl-click will open the link under the mouse cursor
		{
			event = { Up = { streak = 1, button = "Left" } },
			mods = "CTRL",
			action = wezterm.action.OpenLinkAtMouseCursor,
		},
	},
}
