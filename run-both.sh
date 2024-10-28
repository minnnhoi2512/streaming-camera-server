#!/bin/bash

# Function to clean up on exit
cleanup() {
    echo "Stopping all processes..."
    kill $FFMPEG_PID
    kill $SERVER_PID
    exit 0
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Start both scripts in the background
bash run-ffmpeg.sh &
FFMPEG_PID=$!  # Store the PID of the ffmpeg script

bash run-server.sh &
SERVER_PID=$!  # Store the PID of the server script

# Wait for both processes to finish
wait $FFMPEG_PID
wait $SERVER_PID

echo "Both scripts have completed."
