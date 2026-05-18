# syntax=docker/dockerfile:1.7
# Build context must be the repo root (so backend/ and frontend/ are both visible).

# --- Frontend dependency install ---
FROM node:20-alpine AS frontend-deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# --- Frontend production build ---
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY frontend/ ./
RUN npm run build

# --- Backend dependency install (dev + prod, for tsc) ---
FROM node:20-alpine AS backend-deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# --- Backend TypeScript compile ---
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY --from=backend-deps /app/node_modules ./node_modules
COPY backend/package.json backend/package-lock.json backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# --- Backend prod-only dependency install (smaller runtime image) ---
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# --- Runtime image ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    STORAGE_ROOT=/storage \
    PUBLIC_DIR=/app/public
RUN mkdir -p /storage && chown -R node:node /storage
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /app/dist ./public
COPY backend/package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
