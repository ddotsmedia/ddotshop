FROM node:20-alpine
RUN apk add --no-cache libc6-compat openssl ca-certificates
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build
RUN cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
