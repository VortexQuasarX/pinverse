#!/bin/bash
# Persistent dev server launcher
cd /home/z/my-project

# Kill any existing server
pkill -f "next dev -p 3000" 2>/dev/null
sleep 1

# Start server with nohup in a way that survives shell exit
nohup node node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
echo $! > /tmp/next-dev.pid

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "Server ready on port 3000 (PID: $(cat /tmp/next-dev.pid))"
    exit 0
  fi
  sleep 1
done

echo "Server failed to start"
exit 1
