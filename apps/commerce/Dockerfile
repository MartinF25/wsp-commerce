FROM node:20-alpine
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY apps/commerce/package.json apps/commerce/wsp-contracts-0.0.1.tgz ./
RUN pnpm install --no-frozen-lockfile

COPY apps/commerce/src/ src/
COPY apps/commerce/tsconfig.json ./
COPY apps/commerce/prisma/ prisma/

RUN pnpm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma && node dist/server.js"]
