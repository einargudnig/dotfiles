--
-- ██╗    ██╗███████╗███████╗████████╗███████╗██████╗ ███╗   ███╗
-- ██║    ██║██╔════╝╚══███╔╝╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
-- ██║ █╗ ██║█████╗    ███╔╝    ██║   █████╗  ██████╔╝██╔████╔██║
-- ██║███╗██║██╔══╝   ███╔╝     ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║
-- ╚███╔███╔╝███████╗███████╗   ██║   ███████╗██║  ██║██║ ╚═╝ ██║
--  ╚══╝╚══╝ ╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
-- A GPU-accelerated cross-platform terminal emulator
-- https://wezfurlong.org/wezterm/
--
-- SECONDARY terminal. Ghostty is the daily driver (see ghostty/config); this is
-- kept as a fallback. Keybindings here are deliberately minimal -- the tmux
-- prefix bindings live in Ghostty's config, not here.
--
-- The old `keys.lua` helper module was removed: it was never required (the
-- require line had been commented out for a long time) and had gone stale,
-- hardcoding the tmux prefix as CTRL-b when tmux.conf sets it to CTRL-s.

local wezterm = require("wezterm")

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

	-- images
	enable_kitty_graphics = true,

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
		-- Shift+Enter sends Esc+CR, which lets TUIs distinguish it from a plain
		-- Enter (used for multi-line input in Claude Code and similar).
		--
		-- Removed: { key = "a", mods = "CTRL|CTRL", ... } -- "CTRL|CTRL" is a
		-- duplicated modifier that parses as plain CTRL, so the binding sent
		-- \x01 on Ctrl-A, which is exactly what Ctrl-A already does. A no-op.
		{ key = "Enter", mods = "SHIFT", action = wezterm.action({ SendString = "\x1b\r" }) },
	},
}
