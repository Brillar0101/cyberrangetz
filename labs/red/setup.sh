#!/bin/bash

# Start target services on localhost
service apache2 start >/dev/null 2>&1
service ssh start >/dev/null 2>&1
service mariadb start >/dev/null 2>&1

# Keep container alive
tail -f /dev/null
