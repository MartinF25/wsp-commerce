FROM node:20-alpine AS base
RUN npm install -g pnpm@9.15.9

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/types/package.json packages/types/
COPY packages/contracts/package.json packages/contracts/
COPY packages/config/package.json packages/config/
COPY packages/ui/package.json packages/ui/
COPY apps/commerce/package.json apps/commerce/
COPY apps/storefront/package.json apps/storefront/
COPY apps/admin/package.json apps/admin/
COPY apps/firebase/package.json apps/firebase/
COPY packages/types/wsp-types-0.0.1.tgz packages/types/
COPY packages/contracts/wsp-contracts-0.0.1.tgz packages/contracts/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY apps/commerce/ apps/commerce/
COPY packages/contracts/ packages/contracts/
COPY packages/types/ packages/types/
RUN pnpm --filter commerce run build

FROM node:20-alpine AS runner
RUN npm install -g pnpm@9.15.9
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/types/package.json packages/types/
COPY packages/contracts/package.json packages/contracts/
COPY packages/config/package.json packages/config/
COPY packages/ui/package.json packages/ui/
COPY apps/commerce/package.json apps/commerce/
COPY apps/storefront/package.json apps/storefront/
COPY apps/admin/package.json apps/admin/
COPY apps/firebase/package.json apps/firebase/
COPY packages/types/wsp-types-0.0.1.tgz packages/types/
COPY packages/contracts/wsp-contracts-0.0.1.tgz packages/contracts/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/apps/commerce/dist apps/commerce/dist
COPY apps/commerce/prisma apps/commerce/prisma
RUN cd apps/commerce && npx prisma generate --schema=prisma/schema.prisma

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "apps/commerce/dist/server.js"]
