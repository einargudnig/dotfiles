-- Type-aware oxlint.
--
-- oxlint's default rules are syntax-only. The type-aware rules
-- (no-floating-promises, await-thenable, no-misused-promises, ...) need real
-- type information, which oxlint gets by shelling out to `tsgolint`
-- (npm i -g oxlint-tsgolint; symlinked into ~/.local/bin so it does not depend
-- on fnm's per-shell PATH).
--
-- nvim-lspconfig tries to enable this automatically in its `before_init`, but
-- only when it can read `.oxlintrc.json` out of `config.root_dir`. LazyVim's
-- oxc extra replaces `root_dir` with its own async `on_dir` version, so
-- root_dir is not reliably populated at before_init time and the check fails
-- silently inside its pcall. Setting typeAware explicitly skips the heuristic.
--
-- This is safe to leave on globally: oxlint only invokes tsgolint when the
-- project's .oxlintrc.json actually enables type-aware rules. Projects without
-- one are unaffected.
-- https://oxc.rs/docs/guide/usage/linter/type-aware
return {
  "neovim/nvim-lspconfig",
  opts = {
    servers = {
      oxlint = {
        settings = {
          typeAware = true,
        },
      },
    },
  },
}
