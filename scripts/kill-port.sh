#!/bin/bash
# Kill whatever is listening on a given TCP port.
#
# Usage:
#   kill-port 3000
#   kill-port 8080

set -uo pipefail

PORT="${1:-}"

if [ -z "$PORT" ]; then
    echo "Usage: kill-port <port>" >&2
    exit 1
fi

# -t = terse (PIDs only). May return several PIDs, one per line, so the
# expansion below is intentionally unquoted to split them into separate args.
PIDS=$(lsof -ti :"$PORT")

if [ -z "$PIDS" ]; then
    echo "No process found on port $PORT"
    exit 0
fi

# Ask politely first: SIGTERM lets dev servers flush logs and remove socket
# files. Only escalate to SIGKILL for anything still alive a second later.
# shellcheck disable=SC2086
kill $PIDS 2>/dev/null
sleep 1
# shellcheck disable=SC2086
STILL_ALIVE=$(ps -o pid= -p $PIDS 2>/dev/null | tr -d ' ')
if [ -n "$STILL_ALIVE" ]; then
    # shellcheck disable=SC2086
    kill -9 $STILL_ALIVE 2>/dev/null
    echo "Force-killed $(echo "$STILL_ALIVE" | tr '\n' ' ')on port $PORT"
else
    echo "Killed $(echo "$PIDS" | tr '\n' ' ')on port $PORT"
fi
