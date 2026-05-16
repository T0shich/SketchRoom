FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.json tsconfig.app.json vite.config.ts ./
COPY public ./public
COPY src ./src

RUN npm ci
RUN npm run build

FROM nginx:stable-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
