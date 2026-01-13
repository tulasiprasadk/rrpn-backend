FROM node:18-slim

WORKDIR /usr/src/app

# Cache busting - update this to force rebuild
ARG CACHE_BUST=2026-01-13-23-10
RUN echo "Build cache bust: $CACHE_BUST"

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
