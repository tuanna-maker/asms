FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4001/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
