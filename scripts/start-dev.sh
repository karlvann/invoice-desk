#!/bin/bash

# Kill any process using port 5002
echo "Checking for processes on port 5002..."
if lsof -Pi :5002 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 5002 is in use. Killing the process..."
    lsof -ti:5002 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Start the development server on port 5002
echo "Starting invoice app on port 5002..."
PORT=5002 npx next dev