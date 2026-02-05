# Installing Critique for Lazygit

## Installation Steps

1. **Install critique with bun:**
   ```bash
   bun install -g critique
   ```

2. **Add bun bin to PATH (if not already done):**
   
   Add to your shell config (`~/.zshrc`, `~/.bashrc`, etc.):
   ```bash
   export PATH="/Users/einargudjonsson/.bun/bin:$PATH"
   ```

3. **Alternative: Update config to use full path**
   
   The current config uses the full path so it works even without updating PATH:
   ```yaml
   pager: '/Users/einargudjonsson/.bun/bin/critique --stdin'
   ```

## Testing

Test critique directly:
```bash
cd some-git-repo
git diff | /Users/einargudjonsson/.bun/bin/critique --stdin
```

Test in lazygit:
```bash
lazygit
# Navigate to a file with changes and press 'd' to see diff
```

## Critique Features in Lazygit

- **Beautiful syntax highlighting** 
- **Split view** for side-by-side comparison
- **Word-level diff** highlighting
- **Terminal-based** (no external browser needed)
- **Fast and responsive**