#!/usr/bin/env bash
set -euo pipefail

if [ -f /tmp/openpai-voice.pid ]; then
  PID=$(cat /tmp/openpai-voice.pid)
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    rm -f /tmp/openpai-voice.pid
    echo "VoiceServer stopped (PID: $PID)"
  else
    rm -f /tmp/openpai-voice.pid
    echo "VoiceServer was not running (stale PID)"
  fi
else
  echo "VoiceServer not running (no PID file)"
fi
