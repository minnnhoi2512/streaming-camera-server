#!/bin/bash

# Start the cleaner.js script in the background
node ./cleaner.js &

# Store the PID of the cleaner.js process
CLEANER_PID=$!

# Wait for 20 seconds
sleep 25

# Stop the cleaner.js process
kill $CLEANER_PID

# Check if the cleaner.js process was terminated successfully
if [ $? -ne 0 ]; then
    echo "Failed to stop cleaner.js!"
    exit 1
fi

# Change to the libs directory
cd libs || { echo "Failed to change directory to libs"; exit 1; }

# Run the ffmpeg command
ffmpeg -i rtsp://admin:TGODTO@tools.kozow.com:61554 -fflags flush_packets -max_delay 2 -flags +global_header -hls_time 2 -hls_list_size 3 -vcodec copy -y index.m3u8

# Check if ffmpeg command was successful
if [ $? -ne 0 ]; then
    echo "FFMPEG command failed!"
    exit 1
fi


echo "FFMPEG command completed successfully!"
