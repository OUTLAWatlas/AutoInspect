FROM node:20-alpine

WORKDIR /app

COPY shared/prisma/schema.prisma ./shared/prisma/schema.prisma

COPY api/package.json api/package-lock.json* ./api/
WORKDIR /app/api
RUN npm install

RUN npx prisma generate --schema=../shared/prisma/schema.prisma

COPY api/src ./src
COPY api/tsconfig.json ./tsconfig.json

RUN npx tsc

EXPOSE 4000

CMD ["node", "dist/index.js"]
