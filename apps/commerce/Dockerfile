FROM node:20-alpine
RUN apk add --no-cache openssl
RUN npm install -g pnpm@9.15.9

WORKDIR /app

COPY package.json wsp-contracts-0.0.1.tgz ./
RUN pnpm install --no-frozen-lockfile

COPY src/ src/
COPY tsconfig.json ./
COPY prisma/ prisma/

RUN pnpm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma && node dist/server.js"]
