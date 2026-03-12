FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    tcpdump \
    grep \
    gawk \
    coreutils \
    bash \
    less \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Copy the capture log generator and setup
COPY generate-capture.sh /opt/generate-capture.sh
COPY setup.sh /opt/setup.sh
COPY banner.sh /etc/profile.d/cyberrange-banner.sh
RUN chmod +x /opt/generate-capture.sh /opt/setup.sh /etc/profile.d/cyberrange-banner.sh

# Pre-generate the capture log during build
RUN /opt/generate-capture.sh

ENTRYPOINT ["/opt/setup.sh"]
