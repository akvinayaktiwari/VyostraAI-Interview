#!/usr/bin/env bash
# One-time bootstrap for an Oracle Cloud Always Free VM (Ubuntu 22.04/24.04, ARM Ampere A1).
# Run as the default `ubuntu` user:  bash setup-vm.sh
#
# Installs Docker + compose plugin, opens ports 80/443 in the host firewall,
# and creates /opt/vyostra (the deploy directory the GitHub workflow targets).
set -euo pipefail

APP_DIR=/opt/vyostra

echo "==> Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker

echo "==> Opening ports 80 and 443 in iptables"
# Oracle's Ubuntu images ship an iptables ruleset that REJECTs everything but SSH.
# Insert ACCEPT rules ahead of that REJECT and persist them.
for port in 80 443; do
  if ! sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport "$port" -j ACCEPT
  fi
done
if ! sudo iptables -C INPUT -p udp --dport 443 -j ACCEPT 2>/dev/null; then
  sudo iptables -I INPUT 6 -p udp --dport 443 -j ACCEPT
fi
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent
sudo netfilter-persistent save

echo "==> Creating $APP_DIR"
sudo mkdir -p "$APP_DIR/deploy" "$APP_DIR/migrations"
sudo chown -R "$USER:$USER" "$APP_DIR"

cat <<EOF

Done. Next steps:
  1. Log out and back in (so the docker group applies).
  2. In the OCI console, add ingress rules for TCP 80 and 443 (and UDP 443)
     from 0.0.0.0/0 to the subnet's security list.
  3. Create $APP_DIR/.env from .env.production.example.
  4. Push to main (or run the Deploy workflow) to ship the app.
EOF
