#!/bin/bash

# Set hostname
echo "cyberrange-linux" > /etc/hostname
hostname cyberrange-linux

# ============================================
# LAB 1: Navigate & Manage Files
# ============================================

# Create the secret mission file in /root
echo "Your mission: investigate the /opt/challenges directory. Navigate there and explore what's inside." > /root/.secret_mission

# Create /opt/challenges with 3 items
mkdir -p /opt/challenges/level1
mkdir -p /opt/challenges/level2
echo "Welcome to CyberRange TZ Linux Fundamentals!" > /opt/challenges/readme.txt

# Hide the flag for Lab 1
echo "FLAG{linux_navigator_7291}" > /opt/challenges/level1/nav.flag

# ============================================
# LAB 2: Text Processing & Search
# ============================================

# Create a realistic access log
cat > /var/log/lab-access.log << 'LOGEOF'
2024-06-15 08:23:11 admin 192.168.1.10 LOGIN SUCCESS
2024-06-15 08:24:05 admin 192.168.1.10 FILE_ACCESS /etc/passwd
2024-06-15 08:30:22 jdoe 192.168.1.15 LOGIN SUCCESS
2024-06-15 08:31:44 FAILED login 10.0.0.50 user=root
2024-06-15 08:31:45 FAILED login 10.0.0.50 user=admin
2024-06-15 08:31:46 FAILED login 10.0.0.50 user=test
2024-06-15 08:32:01 FAILED login 10.0.0.99 user=root
2024-06-15 09:01:33 jdoe 192.168.1.15 FILE_ACCESS /var/www/html
2024-06-15 09:15:07 admin 192.168.1.10 LOGOUT
2024-06-15 09:20:44 jdoe 192.168.1.15 LOGIN SUCCESS
2024-06-15 10:05:12 admin 192.168.1.10 LOGIN SUCCESS
2024-06-15 10:30:00 jdoe 192.168.1.15 LOGOUT
LOGEOF

# Create /opt/challenges/logs with many files, one containing the flag
mkdir -p /opt/challenges/logs
echo "Normal log data - nothing here" > /opt/challenges/logs/access-01.log
echo "More normal data" > /opt/challenges/logs/access-02.log
echo "Server started successfully" > /opt/challenges/logs/access-03.log
echo "Connection from 192.168.1.1" > /opt/challenges/logs/access-04.log
echo "FLAG{text_master_5538}" > /opt/challenges/logs/access-05.log
echo "Session timeout for user guest" > /opt/challenges/logs/access-06.log
echo "Backup completed" > /opt/challenges/logs/access-07.log

# ============================================
# LAB 3: Permissions & Ownership
# ============================================

mkdir -p /opt/challenges/permissions

# locked.txt - read-only by owner only
echo "This file is locked down tight." > /opt/challenges/permissions/locked.txt
chmod 400 /opt/challenges/permissions/locked.txt

# secret.txt - initially no permissions for group/others
echo "permissions_unlocked" > /opt/challenges/permissions/secret.txt
chmod 000 /opt/challenges/permissions/secret.txt

# admin-file.txt - owned by nobody
echo "This file belongs to the nobody user." > /opt/challenges/permissions/admin-file.txt
chown nobody:nogroup /opt/challenges/permissions/admin-file.txt

# flag.txt - no permissions at all
echo "FLAG{permission_granted_3364}" > /opt/challenges/permissions/flag.txt
chmod 000 /opt/challenges/permissions/flag.txt

# ============================================
# LAB 4: System & Process Management
# ============================================

# Start a "suspicious" process running as nobody
cat > /usr/local/bin/suspicious_process << 'SPEOF'
#!/bin/bash
while true; do sleep 60; done
SPEOF
chmod +x /usr/local/bin/suspicious_process
su -s /bin/bash -c "/usr/local/bin/suspicious_process &" nobody

# Start a process with the flag hidden in its command arguments
bash -c 'exec -a "secret_service FLAG{system_admin_8817}" sleep infinity' &

# Set an environment variable for discovery
export SECRET_KEY=cyberrange2024

# ============================================
# LAB 5: Bash Scripting Basics
# ============================================

mkdir -p /opt/challenges/scripts

# Create the decode script that reveals the flag
cat > /opt/challenges/scripts/decode.sh << 'DECEOF'
#!/bin/bash
echo "=== CyberRange TZ Flag Decoder ==="
echo ""

# The flag is split across multiple variables
part1="FLAG{"
part2="bash"
part3="_scripter"
part4="_6643}"

# Use a loop to build the flag
flag=""
for part in "$part1" "$part2" "$part3" "$part4"; do
  flag="${flag}${part}"
done

# Check if we're running as a script (not just sourced)
if [ -n "$BASH_SOURCE" ]; then
  echo "Decoding complete!"
  echo ""
  echo "Your flag is: $flag"
else
  echo "Error: Run this as a script, not with source!"
fi
DECEOF

# Keep container alive
tail -f /dev/null
