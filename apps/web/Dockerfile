FROM node:24-alpine AS build

WORKDIR /workspace

RUN npm install --global pnpm@11.9.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/content/package.json packages/content/package.json
COPY packages/game-core/package.json packages/game-core/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/contracts packages/contracts
COPY packages/content packages/content
COPY packages/game-core packages/game-core

RUN pnpm --filter @idle-tamer/web build

FROM nginx:alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=6 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
