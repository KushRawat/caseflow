FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false || npm install --production=false
COPY prisma ./prisma
COPY tsconfig.json tsconfig.base.json tsup.config.ts vitest.config.ts ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY package.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
