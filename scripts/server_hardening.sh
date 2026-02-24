#!/bin/bash
# Run this on the Hetzner server as root: bash scripts/server_hardening.sh

echo "=== 1. Disable root password login (SSH key only) ==="
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
echo "DONE: Password login disabled"

echo "=== 2. Disable root login via SSH ==="
sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart sshd
echo "DONE: Root login restricted to key-only"

echo "=== 3. Install fail2ban (auto-ban brute force attempts) ==="
apt-get install -y fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
findtime = 600
EOF
systemctl enable fail2ban
systemctl restart fail2ban
echo "DONE: fail2ban installed and configured"

echo "=== 4. Verify UFW firewall ==="
ufw status
echo "Expected: 22, 80, 443 only"

echo "=== 5. Verify Docker ports not exposed ==="
ss -tlnp | grep -E "8000|3000|5432|6379"
echo "Expected: all bound to 127.0.0.1, none to 0.0.0.0"

echo "=== 6. Enable automatic security updates ==="
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
echo "DONE: Auto security updates enabled"

echo "=== 7. Check for exposed secrets ==="
grep -r "SECRET_KEY\|API_KEY\|PASSWORD" /opt/lytherahub/backend/.env | sed 's/=.*/=***REDACTED***/'
echo "If any secrets appear above they are in .env (correct). If they appear in .py files that is a problem."

echo "=== Server hardening complete ==="
