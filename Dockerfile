# syntax=docker/dockerfile:1

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build-only

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine

# Remove default config and write one suited for this SPA
RUN rm /etc/nginx/conf.d/default.conf

RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    gzip on;\n\
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;\n\
\n\
    # SPA fallback — all routes resolve to index.html\n\
    location /expense-web/ {\n\
        try_files $uri $uri/ /expense-web/index.html;\n\
    }\n\
\n\
    # Cache hashed assets aggressively\n\
    location ~* \\.(?:js|css|woff2?|png|jpg|svg|ico)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    # Healthcheck endpoint\n\
    location /ping {\n\
        return 200 "ok";\n\
        add_header Content-Type text/plain;\n\
    }\n\
}\n' > /etc/nginx/conf.d/app.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
