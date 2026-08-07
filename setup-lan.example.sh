#!/usr/bin/env bash
#
# EXAMPLE LAN setup script.
#   cp setup-lan.example.sh setup-lan.sh   # then EDIT the variables below
#   sudo bash setup-lan.sh
#
# NOTE: setup-lan.sh is gitignored because it holds machine-specific
# usernames, paths and LAN IPs. Only this *.example version is committed.
#
set -euo pipefail

# ---- Adjust these for your environment (no personal data here) ----
LAN_APP_PORT="${LAN_APP_PORT:-5173}"     # Spotyfin web app port
LAN_JF_PORT="${LAN_JF_PORT:-8096}"       # Jellyfin API port
LINGER_USER="${LINGER_USER:-$USER}"      # OS user that runs the app service
# -------------------------------------------------------------------

echo "== Spotyfin LAN setup =="

# 1) Allow the app and Jellyfin through the firewall, if UFW is used.
#    (Idempotent; silently skipped if ufw is not installed/enforced.)
if command -v ufw >/dev/null 2>&1; then
  ufw allow "$LAN_APP_PORT"/tcp >/dev/null 2>&1 \
    || echo "  (ufw: $LAN_APP_PORT already allowed or ufw inactive)"
  ufw allow "$LAN_JF_PORT"/tcp >/dev/null 2>&1 \
    || echo "  (ufw: $LAN_JF_PORT already allowed or ufw inactive)"
  echo "  firewall: allowed $LAN_APP_PORT/tcp and $LAN_JF_PORT/tcp (if ufw is enabled)"
fi

# 2) Boot persistence: keep the per-user systemd service running even with
#    no interactive login session. (The one step that requires root.)
loginctl enable-linger "$LINGER_USER" \
  && echo "  enabled lingering for user '$LINGER_USER' (auto-start at boot)"

echo
echo "Done. The web app is reachable on your local network at:"
echo "    http://<this-pc-IP>:$LAN_APP_PORT"
echo
echo "For a system-wide (root) unit, see:"
echo "    system/spotyfin@.service.example"
