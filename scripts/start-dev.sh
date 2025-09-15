#!/bin/bash

# Kill any process using port 7002
echo "Checking for processes on port 7002..."
if lsof -Pi :7002 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 7002 is in use. Killing the process..."
    lsof -ti:7002 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Start the development server on port 7002
echo "Starting invoice app on port 7002..."
PORT=7002 npx next dev