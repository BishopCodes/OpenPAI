#!/usr/bin/env bash
if curl -s http://localhost:8888/health | grep -q "ok" 2>/dev/null; then
  echo "VoiceServer: running"
else
  echo "VoiceServer: not running"
fi
