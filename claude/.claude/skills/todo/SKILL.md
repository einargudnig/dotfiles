---
name: todo
description: Manage tasks using Taskwarrior and the todo-sync CLI. Use when the user asks about tasks, todos, task management, syncing with Things 3 or Asana, or wants to interact with their task system. Triggers on "tasks", "todos", "taskwarrior", "things", "asana", "what should I work on", "show my tasks".
argument-hint: <optional: taskwarrior filter or command>
---

# Todo — Personal Task Management

## Overview

The user's task system is built around **Taskwarrior** as the central hub, with bidirectional sync to **Things 3** (macOS) and **Asana** (cloud). A custom CLI tool (`todo-sync`) handles import, filtering, completion push-back, and stale task detection.

Tasks from Things 3 are filtered through a local **Ollama LLM** so only computer/dev-related work enters Taskwarrior. Asana tasks are imported with full subtask hierarchy and comments.

## System Architecture

```
Things 3 (macOS)  ──→  Ollama filter  ──→  Taskwarrior  ←──  Asana (API)
        ↑                                       │                  ↑
        └───────── completion push-back ─────────┴──────────────────┘
```

- **Taskwarrior**: Source of truth for day-to-day task work
- **Things 3**: Capture app (mobile + macOS), synced via SQLite
- **Asana**: Team/project tasks, synced via API with PAT (includes subtasks and comments)
- **todo-sync CLI**: TypeScript tool at `/Users/einargudjonsson/personal/todo-system/ts/`

## Taskwarrior Quick Reference

### Viewing Tasks

```bash
# List all pending tasks
task list

# List tasks from Things 3
task +things3 list

# List tasks from Asana
task +asana list

# List tasks due today
task due:today list

# List tasks by project
task project:MyProject list

# List overdue tasks
task +OVERDUE list

# List high-priority tasks
task priority:H list

# Show next recommended task
task next

# Detailed info about a specific task
task <ID> info

# List completed tasks
task completed
```

### Modifying Tasks

```bash
# Mark a task as done
task <ID> done

# Add a new task
task add "Task description" project:MyProject priority:H due:tomorrow

# Modify a task
task <ID> modify priority:M due:friday

# Add an annotation (note) to a task
task <ID> annotate "Some additional context"

# Start working on a task (sets active status)
task <ID> start

# Stop working on a task
task <ID> stop

# Delete a task
task <ID> delete
```

### Filtering & Reports

```bash
# Tasks with a specific tag
task +tagname list

# Tasks without a tag
task -tagname list

# Tasks modified recently
task modified:today list

# Combine filters
task +asana priority:H due.before:eow list

# Custom columns
task rc.report.list.columns:id,description,project,due list
```

### Custom UDAs (User Defined Attributes)

These are set by todo-sync and used for duplicate detection and sync tracking:

| UDA | Purpose |
|-----|---------|
| `things3_uuid` | Things 3 task UUID |
| `asana_gid` | Asana global ID |
| `source` | Origin: "things3" or "asana" |
| `things3_synced` | Completion pushed to Things 3 |
| `asana_synced` | Completion pushed to Asana |
| `asana_parent_gid` | Parent task for subtask linking |

## todo-sync CLI

The CLI is located at `/Users/einargudjonsson/personal/todo-system/ts/`.

### Running Commands

```bash
# From the project directory
cd /Users/einargudjonsson/personal/todo-system/ts
node dist/cli.js <command> [--dry-run]

# Or if using the bash wrapper
todo-sync-ts <command>
```

### Available Commands

| Command | What it does |
|---------|-------------|
| `setup` | First-time setup: creates config, configures Taskwarrior UDAs |
| `things` | Import tasks from Things 3 (filtered through Ollama) |
| `asana` | Import tasks from Asana |
| `all` | Import from both Things 3 and Asana |
| `push` | Push completed tasks back to both sources |
| `push-things` | Push completions to Things 3 only |
| `push-asana` | Push completions to Asana only |
| `sync` | Full bidirectional sync: pull all + push completions |
| `install-hook` | Install Taskwarrior on-exit hook for real-time completion sync (Things 3 + Asana) |
| `uninstall-hook` | Remove the hook |

### Global Flags

- `--dry-run` — Preview what would happen without making changes

## Configuration

**Config file**: `~/.config/todo-sync/config.toml`

```toml
[asana]
personal_access_token = "..."

[things]
enabled = true
auth_token = ""
areas = []  # Optional: filter to specific Things 3 areas

[sync]
things_tag = "things3"
asana_tag = "asana"

[ollama]
enabled = true
model = "lfm2.5-thinking"
base_url = "http://localhost:11434"
```

## Key Features

### Stale Task Detection

During sync, todo-sync detects tasks that were deleted or completed in the source (Things 3 or Asana) but still exist as pending in Taskwarrior. These "stale" tasks are automatically completed in Taskwarrior to keep things in sync. External IDs are captured *before* Ollama filtering to avoid false positives.

### Real-Time On-Exit Hook

The Taskwarrior on-exit hook (`on-exit-sync`) fires whenever a task is modified. If a task is marked completed and has a `things3_uuid` or `asana_gid`, the completion is immediately pushed back to the source. The hook uses `rc.hooks=off` internally to prevent recursive triggering.

The hook was renamed from the legacy `on-exit-things-sync` to `on-exit-sync` — the `install-hook` command handles this migration automatically.

### Asana Subtask & Comment Syncing

Asana tasks are imported with their full subtask hierarchy. Subtasks are linked to parent tasks via Taskwarrior's `depends:` field. Comments/stories from Asana are synced as Taskwarrior annotations. API calls are parallelized for performance.

## Automated Sync

A **launchd** plist runs `sync` every 30 minutes:

```bash
# Check if running
launchctl list | grep todo-sync

# View logs
tail -f /tmp/todo-sync.log

# Restart
launchctl stop com.todo-sync && launchctl start com.todo-sync
```

## Common Workflows

### "What should I work on?"

```bash
# Show the next recommended task
task next

# Or list by urgency
task list
```

### "Show me my tasks from Asana"

```bash
task +asana list
```

### "Sync everything now"

```bash
cd /Users/einargudjonsson/personal/todo-system/ts && node dist/cli.js sync
```

### "I finished a task in Taskwarrior, sync it back"

```bash
# If the on-exit hook is installed, completions auto-sync to Things 3 AND Asana on `task done`
# To manually push all completions:
cd /Users/einargudjonsson/personal/todo-system/ts && node dist/cli.js push
```

### Building After Code Changes

```bash
cd /Users/einargudjonsson/personal/todo-system/ts && npm run build
```

### Running Tests

```bash
cd /Users/einargudjonsson/personal/todo-system/ts && npm test
```

## Project Source Code

Key files for development work on the sync tool itself:

| File | Purpose |
|------|---------|
| `ts/src/cli.ts` | CLI entry point (Commander.js) |
| `ts/src/taskwarrior.ts` | Taskwarrior UDA setup, upsert, duplicate detection |
| `ts/src/things-reader.ts` | Things 3 SQLite reader |
| `ts/src/asana-reader.ts` | Asana API client |
| `ts/src/things-writer.ts` | Push completions to Things 3 |
| `ts/src/asana-writer.ts` | Push completions to Asana |
| `ts/src/ollama-filter.ts` | LLM task classification |
| `ts/src/hook-on-exit.ts` | Taskwarrior on-exit hook |
| `ts/src/types.ts` | Shared TypeScript interfaces |
| `ts/src/config.ts` | TOML config loading |

## Rules

- **Always use `task` commands for task interaction.** Never modify Taskwarrior's data files directly.
- **Run `--dry-run` first** when doing bulk sync operations, to preview changes.
- **Don't modify UDAs manually** (`things3_uuid`, `asana_gid`, etc.) — these are managed by todo-sync.
- **Build before running** after code changes: `npm run build` in the `ts/` directory.
- **Check sync logs** at `/tmp/todo-sync.log` if automated sync seems broken.
- When the user says "tasks" or "todos" without context, default to showing `task next` or `task list`.
- When asked to add a task, use `task add` directly — don't go through todo-sync unless the user wants it synced to Things/Asana.
