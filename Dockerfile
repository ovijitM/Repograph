# ── Stage 1: Build the React Frontend ──────────────────────────
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Copy package descriptors first to leverage Docker layer caching
COPY client/package*.json ./
RUN npm ci

# Copy client source code and build
COPY client/ ./
RUN npm run build

# ── Stage 2: Assemble Production Server Image ──────────────────
FROM node:20-alpine AS server-production
WORKDIR /app/server

# Install Git (required for codebase cloning and branches list fetching)
RUN apk add --no-cache git

# Copy server package descriptors and install production dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy server source code
COPY server/src/ ./src/

# Copy compiled frontend static assets into server public folder
COPY --from=client-builder /app/client/dist ./public

# Ensure the temp directory exists for Git clones
RUN mkdir -p temp && chmod 777 temp

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["node", "src/index.js"]
