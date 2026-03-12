FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    bash \
    coreutils \
    findutils \
    grep \
    procps \
    nano \
    less \
    tree \
    net-tools \
    curl \
    wget \
    tar \
    zip \
    unzip \
    man-db \
    && rm -rf /var/lib/apt/lists/*

# Setup script that creates all exercise files and starts processes
COPY setup.sh /opt/setup.sh
RUN chmod +x /opt/setup.sh

ENTRYPOINT ["/opt/setup.sh"]
