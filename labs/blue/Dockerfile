FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    ufw \
    net-tools \
    procps \
    less \
    && rm -rf /var/lib/apt/lists/*

# Create fake scan logs that students will analyze
COPY syslog /var/log/syslog

# Place the flag
RUN echo "FLAG{scanner_caught_9932}" > /root/flag.txt

# Setup script
COPY setup.sh /opt/setup.sh
RUN chmod +x /opt/setup.sh

ENTRYPOINT ["/opt/setup.sh"]
