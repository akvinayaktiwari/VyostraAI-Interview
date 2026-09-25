#!/usr/bin/env bash
# One-time bootstrap for the app VM (Ubuntu 22.04/24.04; built for a GCP e2-micro).
# Run as the login user:  bash setup-vm.sh
#
# Installs Docker + compose plugin, adds swap on small-RAM hosts, opens 80/443
# in the host firewall if the image blocks them, and creates /opt/vyostra
# (the deploy directory the GitHub workflow targets).
set -euo pipefail

APP_DIR=/opt/vyostra
SWAP_FILE=/swapfile
SWAP_SIZE=2G

echo "==> Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker

echo "==> Swap"
# An e2-micro has 1 GB RAM; swap keeps Postgres + Node from being OOM-killed.
if [ "$(awk '/MemTotal/ {print $2}' /proc/meminfo)" -lt 4000000 ] && ! swapon --show | grep -q "$SWAP_FILE"; then
  sudo fallocate -l "$SWAP_SIZE" "$SWAP_FILE"
  sudo chmod 600 "$SWAP_FILE"
  sudo mkswap "$SWAP_FILE"
  sudo swapon "$SWAP_FILE"
  grep -q "$SWAP_FILE" /etc/fstab || echo "$SWAP_FILE none swap sw 0 0" | sudo tee -a /etc/fstab
  echo "vm.swappiness=10" | sudo tee /etc/sysctl.d/99-swappiness.conf
  sudo sysctl -p /etc/sysctl.d/99-swappiness.conf
else
  echo "swap not needed or already configured"
fi

echo "==> Host firewall"
# GCP images leave iptables open (the VPC firewall does the filtering). Some
# images (e.g. Oracle's Ubuntu) REJECT everything but SSH; only then add rules.
if sudo iptables -S INPUT | grep -q -- "-j REJECT"; then
  for port in 80 443; do
    sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null \
      || sudo iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
  done
  sudo iptables -C INPUT -p udp --dport 443 -j ACCEPT 2>/dev/null \
    || sudo iptables -I INPUT 1 -p udp --dport 443 -j ACCEPT
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent
  sudo netfilter-persistent save
else
  echo "no REJECT rules; nothing to open"
fi

echo "==> Creating $APP_DIR"
sudo mkdir -p "$APP_DIR/deploy" "$APP_DIR/migrations"
sudo chown -R "$USER:$USER" "$APP_DIR"

cat <<EOF

Done. Next steps:
  1. Log out and back in (so the docker group applies).
  2. Create $APP_DIR/.env from .env.production.example.
  3. Push to main (or run the Deploy workflow) to ship the app.
EOF
