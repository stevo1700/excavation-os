# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL (needed for Prisma)
RUN apk add --no-cache openssl

# Copy package files first for better caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy only what's needed for production
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.mjs ./next.config.mjs
# Create public dir if it doesn't exist
RUN mkdir -p /app/public

# Prisma client is already in node_modules from builder stage
# No need to regenerate

EXPOSE 3000

CMD ["npm", "start"]
