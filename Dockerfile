# Production Dockerfile for NestJS + Next.js monorepo
# Multi-stage build: source code stays in builder, only built artifacts in final image

# Stage 1: Build the application
FROM node:24-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including dev dependencies for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Production runtime
FROM node:24-alpine AS runner

# Set production environment
ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
	adduser --system --uid 1001 nestjs

# Set working directory
WORKDIR /app

# Copy package files for production dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
COPY packages/shared/package.json ./packages/shared/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod && \
	pnpm store prune

# Copy built artifacts from builder stage (no source code)
COPY --from=builder --chown=nestjs:nodejs /app/packages/server/dist ./packages/server/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/client/.next ./packages/client/.next
COPY --from=builder --chown=nestjs:nodejs /app/packages/client/public ./packages/client/public
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared ./packages/shared

# Copy package.json files needed at runtime
COPY --from=builder --chown=nestjs:nodejs /app/packages/server/package.json ./packages/server/
COPY --from=builder --chown=nestjs:nodejs /app/packages/client/package.json ./packages/client/

# Switch to non-root user
USER nestjs

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
	CMD node -e "const port = process.env.PORT || 4000; require('http').get(`http://localhost:${port}/api/health`, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["pnpm", "start"]
