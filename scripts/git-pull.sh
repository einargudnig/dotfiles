#!/bin/bash

# Smart git pull — runs the appropriate install command
# when package.json changes are detected in the pulled commits.

# Capture current HEAD before pulling
BEFORE=$(git rev-parse HEAD 2>/dev/null)

if [ $? -ne 0 ]; then
	echo "Not a git repository."
	exit 1
fi

echo "Pulling latest changes..."

# Pull from remote
git pull "$@"
PULL_EXIT=$?

if [ $PULL_EXIT -ne 0 ]; then
	exit $PULL_EXIT
fi

AFTER=$(git rev-parse HEAD)

# If HEAD didn't move, nothing new was pulled
if [ "$BEFORE" = "$AFTER" ]; then
	echo "Already up to date, no new commits."
	exit 0
fi

echo "New commits pulled ($BEFORE → $AFTER)"

# List changed files for visibility
CHANGED=$(git diff --name-only "$BEFORE" "$AFTER")
echo "Changed files:"
echo "$CHANGED" | sed 's/^/  /'

# Check if package.json changed between the two commits
if echo "$CHANGED" | grep -Eq '(^|/)package\.json$'; then
	echo ""
	echo "📦 package.json changed — installing dependencies..."

	# Auto-detect package manager by lock file
	if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
		echo "→ Running: bun install"
		bun install
	elif [ -f "pnpm-lock.yaml" ]; then
		echo "→ Running: pnpm install"
		pnpm install
	elif [ -f "yarn.lock" ]; then
		echo "→ Running: yarn install"
		yarn install
	else
		echo "→ Running: npm install"
		npm install
	fi

	echo "✅ Dependencies installed."
else
	echo "No package.json changes, skipping install."
fi
