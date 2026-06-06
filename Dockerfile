# DdotsShop — single-stage image (Next.js app + workers share this image)
FROM node:22-bookworm-slim

# Prisma needs openssl; curl optional for debugging
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps (postinstall runs `prisma generate` — schema copied first).
# Use `npm install` (not `npm ci`): the image's npm major differs from the host's
# and resolves a few transitive pins differently, which trips ci's strict lock check.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund

# App source + build
COPY . .
RUN npx prisma generate && npm run build

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
