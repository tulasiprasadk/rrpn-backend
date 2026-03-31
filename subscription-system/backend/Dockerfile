FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production --no-audit --no-fund
COPY src ./src
COPY db ../db
ENV PORT=4000
EXPOSE 4000
CMD ["node", "src/index.js"]
