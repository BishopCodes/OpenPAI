#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if curl -s http://localhost:8888/health | grep -q "ok" 2>/dev/null; then
  echo "VoiceServer already running"
  exit 0
fi

nohup bun run server.ts > /tmp/openpai-voice.log 2>&1 &
echo $! > /tmp/openpai-voice.pid
echo "VoiceServer started (PID: $!)"
