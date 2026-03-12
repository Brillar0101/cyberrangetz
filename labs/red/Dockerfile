FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive

# Install nmap and target services
RUN apt-get update && apt-get install -y \
    nmap \
    curl \
    apache2 \
    openssh-server \
    mariadb-server \
    net-tools \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH
RUN mkdir -p /run/sshd && \
    echo "root:labpassword" | chpasswd

# Configure Apache - add flag to server header
RUN echo "ServerTokens Full" >> /etc/apache2/apache2.conf && \
    echo "Header set X-Flag \"FLAG{recon_complete_4821}\"" >> /etc/apache2/apache2.conf && \
    a2enmod headers

# Setup script that starts all services
COPY setup.sh /opt/setup.sh
RUN chmod +x /opt/setup.sh

ENTRYPOINT ["/opt/setup.sh"]
