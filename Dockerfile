FROM node:18-slim

WORKDIR /usr/src/app

# Cache busting - update this to force rebuild
ARG CACHE_BUST=2026-01-14-01-00
RUN echo "Build cache bust: $CACHE_BUST"

# Install dependencies needed for sharp (native module)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Install with optional dependencies to ensure sharp binaries are included
RUN npm install --production --include=optional

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
