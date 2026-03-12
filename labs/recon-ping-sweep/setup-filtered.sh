#!/bin/bash

# Block ALL incoming ICMP echo-request packets (ping)
# This makes the host invisible to ping sweeps while keeping all other services running
iptables -A INPUT -p icmp --icmp-type echo-request -j DROP 2>/dev/null

# Start nginx in foreground (keeps container running + serves HTTP)
nginx -g "daemon off;"
