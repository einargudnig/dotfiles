# Lazygit Configuration

This directory contains the Lazygit configuration files managed in dotfiles.

## Setup
- `config.yml` is symlinked to `~/Library/Application Support/lazygit/config.yml`
- State file remains at system location: `~/Library/Application Support/lazygit/state.yml`

## Configuration Options

Key areas you can customize in `config.yml`:

### GUI Settings
- `showFileTree`: Show/hide file tree panel
- `showRandomTip`: Show tips on startup
- `nerdFontsVersion`: Font icon support

### Git Integration  
- `pager`: Set custom pager (delta, bat, etc.)
- `colorArg`: Color output settings

### Keybindings
- Customize shortcuts for all actions
- See: https://github.com/jesseduffield/lazygit/blob/master/docs/keybindings

### Themes
- Custom color schemes
- See: https://github.com/jesseduffield/lazygit/blob/master/docs/Config.md#color

## Useful Commands
- `lazygit --help` - See all CLI options
- `:` in lazygit - Open command palette  
- `?` in lazygit - Show help/keybindings