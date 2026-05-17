FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY prisma.config.ts ./ 
RUN npm ci

COPY ./prisma/ ./prisma/
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/app.js"]