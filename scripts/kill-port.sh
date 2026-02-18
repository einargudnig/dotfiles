#!/bin/bash

# Kill the process listening on a given port
#
# Usage:
#   kill-port 3000
#   kill-port 8080

PORT="$1"

if [ -z "$PORT" ]; then
    echo "Usage: kill-port <port>"
    exit 1
fi

PID=$(lsof -ti :"$PORT")

if [ -z "$PID" ]; then
    echo "No process found on port $PORT"
    exit 0
fi

kill -9 $PID
echo "Killed process $PID on port $PORT"
