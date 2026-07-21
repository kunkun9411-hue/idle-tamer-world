FROM node:24-alpine

WORKDIR /workspace

RUN npm install --global pnpm@11.9.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/content/package.json packages/content/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/game-core/package.json packages/game-core/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/config packages/config
COPY packages/content packages/content
COPY packages/contracts packages/contracts
COPY packages/database packages/database
COPY packages/game-core packages/game-core

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --retries=8 \
  CMD wget -q -O /dev/null http://127.0.0.1:3001/health/ready || exit 1

CMD ["pnpm", "--filter", "@idle-tamer/api", "start"]
