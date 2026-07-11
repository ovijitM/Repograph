FROM node:20-alpine
WORKDIR /app

# Install Git (required for codebase cloning and branch resolution)
RUN apk add --no-cache git

# Copy dependency descriptors
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY src/ ./src/

# Ensure temp cloning folder exists
RUN mkdir -p temp && chmod 777 temp

ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["node", "src/index.js"]
