. "$HOME/.cargo/env"

# uv
export PATH="/Users/einargudjonsson/.local/bin:$PATH"

# GitHub MCP plugin reads this for its Authorization header
# (cached -- `gh auth token` costs ~90ms and zshenv runs for EVERY zsh process;
#  refreshed in the background when the cache is older than 12h)
[[ -s ~/.cache/gh-token ]] && export GITHUB_PERSONAL_ACCESS_TOKEN="$(<~/.cache/gh-token)"
# The age check must be an array assignment with a LITERAL path: [[ ]] does not
# perform filename generation, so `[[ -n ~/.cache/gh-token(#qN.mh+12) ]]` is
# always true and re-spawned `gh auth token` on every single zsh process.
_gh_token_stale=( ~/.cache/gh-token(N.mh+12) )
if [[ ! -s ~/.cache/gh-token || -n $_gh_token_stale ]]; then
  ( mkdir -p ~/.cache
    command gh auth token 2>/dev/null > ~/.cache/gh-token.$$ \
      && chmod 600 ~/.cache/gh-token.$$ \
      && mv -f ~/.cache/gh-token.$$ ~/.cache/gh-token \
      || rm -f ~/.cache/gh-token.$$ ) &>/dev/null &!
fi
unset _gh_token_stale
