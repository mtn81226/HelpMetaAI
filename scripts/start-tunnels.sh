#!/usr/bin/env bash
# Script tạo tên miền HTTPS công khai miễn phí cho Web và n8n qua Cloudflare Tunnel

CLOUDFLARED="$HOME/.local/bin/cloudflared"

if [ ! -f "$CLOUDFLARED" ]; then
  echo "Đang cài đặt cloudflared..."
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o "$CLOUDFLARED"
  chmod +x "$CLOUDFLARED"
fi

echo "=================================================="
echo "🌐 Đang tạo tên miền HTTPS miễn phí toàn cầu..."
echo "=================================================="

# Chạy ngầm 2 tunnel
pkill -f "cloudflared tunnel" 2>/dev/null || true
nohup "$CLOUDFLARED" tunnel --url http://localhost:3000 > /tmp/tunnel-web.log 2>&1 &
nohup "$CLOUDFLARED" tunnel --url http://localhost:5678 > /tmp/tunnel-n8n.log 2>&1 &

sleep 4

echo "✅ Web HelpMate AI URL:"
grep -o 'https://[-a-zA-Z0-9.]*\.trycloudflare\.com' /tmp/tunnel-web.log | head -1

echo "✅ n8n Workflows Studio URL:"
grep -o 'https://[-a-zA-Z0-9.]*\.trycloudflare\.com' /tmp/tunnel-n8n.log | head -1
echo "=================================================="
