#!/bin/bash

# Generate a daily work report by summarizing git commits across Maul repos
# Uses Claude to create a lively, emoji-rich summary for sharing with the team
#
# Usage:
#   ./daily-report.sh           # report for today
#   ./daily-report.sh yesterday # report for yesterday
#   ./daily-report.sh 2026-02-14 # report for a specific date
#
# Environment variables (all optional):
#   WORK_REPOS_DIR   - path to repos directory (default: ~/work)
#   WORK_REPOS       - space-separated repo names (default: maul-backend foodie-web kitchen-web dashboard)
#   WORK_GIT_AUTHOR  - git author email (default: einargudnig@gmail.com)

REPOS_DIR="${WORK_REPOS_DIR:-$HOME/work}"
read -ra REPOS <<< "${WORK_REPOS:-maul-backend foodie-web kitchen-web dashboard}"
AUTHOR="${WORK_GIT_AUTHOR:-einargudnig@gmail.com}"
DATE="${1:-today}"

echo "=== Daily Report Generator ==="
echo "Date: $DATE"
echo "Author: $AUTHOR"
echo "Scanning repos: ${REPOS[*]}"
echo ""

commits=""

for repo in "${REPOS[@]}"; do
    repo_path="$REPOS_DIR/$repo"
    if [ ! -d "$repo_path/.git" ]; then
        echo "  [$repo] skipped (not found)"
        continue
    fi

    repo_commits=$(/usr/bin/git -C "$repo_path" log \
        --author="$AUTHOR" \
        --since="$DATE 00:00" \
        --until="$DATE 23:59" \
        --format="%h %s" \
        --stat \
        2>/dev/null)

    if [ -n "$repo_commits" ]; then
        commit_count=$(/usr/bin/git -C "$repo_path" log \
            --author="$AUTHOR" \
            --since="$DATE 00:00" \
            --until="$DATE 23:59" \
            --oneline \
            2>/dev/null | wc -l | tr -d ' ')
        echo "  [$repo] $commit_count commit(s) found"
        commits+="
## $repo
$repo_commits
"
    else
        echo "  [$repo] no commits"
    fi
done

echo ""

if [ -z "$commits" ]; then
    echo "No commits found for $DATE. Nothing to report."
    exit 0
fi

prompt="Here are my git commits from today across our work repositories:
$commits

Please write a daily work report summarizing what I accomplished today. The report should be:
- Written for sharing with superiors and colleagues in a team chat
- Organized by project/repo
- Use plenty of emojis to make it lively and fun to read
- Keep it concise but informative
- Use bullet points
- Start with a greeting and end with a sign-off
- Don't include commit hashes, just summarize the work done
- IMPORTANT: Group related commits into a single high-level accomplishment. If multiple commits are clearly part of the same feature or task (e.g. building it, then refactoring/moving it, then fixing it), describe the end result as one bullet point, not each step separately. Focus on what was delivered, not the journey to get there."

echo "Generating summary..."
echo ""

claude --dangerously-skip-permissions -p "$prompt"
