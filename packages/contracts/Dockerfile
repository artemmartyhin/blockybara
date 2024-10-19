FROM node:20

# Install necessary system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Set up GPG key and Docker repository
RUN mkdir -m 0755 -p /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | tee /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list

# Install Docker CLI
RUN apt-get update && apt-get install -y docker-ce-cli

# Set the working directory
WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm

# Set pnpm store directory to reduce redundancy
RUN pnpm config set store-dir /usr/src/app/.pnpm-store --global

# Clean npm cache
RUN npm cache clean --force

# Copy project files
COPY . .

# Set the working directory to the contracts package
WORKDIR /usr/src/app/packages/contracts

# Remove existing node_modules to ensure a clean installation
RUN rm -rf node_modules

# Install dependencies using pnpm
RUN pnpm install

# Expose the necessary port for the service
EXPOSE 3002

# Copy the index.sh script and make it executable
COPY index.sh /usr/src/app/index.sh
RUN chmod +x /usr/src/app/index.sh