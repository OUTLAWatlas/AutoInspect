FROM cgr.dev/chainguard/node:latest-dev AS deps

USER root

WORKDIR /app

COPY shared/prisma/schema.prisma ./shared/prisma/schema.prisma
COPY api/package.json api/package-lock.json ./api/

WORKDIR /app/api
RUN npm ci

FROM deps AS build

RUN npx prisma generate --schema=../shared/prisma/schema.prisma

COPY api/src ./src
COPY api/tsconfig.json ./tsconfig.json

RUN npx tsc

FROM cgr.dev/chainguard/node:latest-dev AS prod-deps

USER root

WORKDIR /app/api

COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev

FROM cgr.dev/chainguard/node:latest AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --chown=65532:65532 shared/prisma/schema.prisma ./shared/prisma/schema.prisma
COPY --from=prod-deps --chown=65532:65532 /app/api/node_modules ./api/node_modules
COPY --from=build --chown=65532:65532 /app/api/dist ./api/dist
COPY --from=build --chown=65532:65532 /app/shared/generated/prisma ./shared/generated/prisma

WORKDIR /app/api

EXPOSE 4000

ENTRYPOINT ["node"]
CMD ["dist/bootstrap.js"]