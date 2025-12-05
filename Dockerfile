# Multi-stage Dockerfile for KickAI Matches Next.js Application

# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Cache bust: 2025-12-03-22:18 - dotenv added to deps
# Install dependencies
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm install; \
  fi

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Set NEXT_PUBLIC environment variables for build-time embedding
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

# Build the application
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
  else \
    npm run build; \
  fi

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Install system dependencies including PostgreSQL server
RUN apk add --no-cache \
    postgresql \
    postgresql-contrib \
    redis \
    supervisor \
    bash \
    curl \
    su-exec

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy database files and scripts
COPY --chown=nextjs:nodejs ./drizzle ./drizzle
COPY --chown=nextjs:nodejs ./src/app ./src/app
COPY --chown=nextjs:nodejs ./src/db ./src/db
COPY --chown=nextjs:nodejs ./src/worker ./src/worker
COPY --chown=nextjs:nodejs ./src/scripts ./src/scripts
COPY --chown=nextjs:nodejs ./src/data ./src/data
COPY --chown=nextjs:nodejs ./src/services ./src/services
COPY --chown=nextjs:nodejs ./src/utils ./src/utils
COPY --chown=nextjs:nodejs ./init.sql ./init.sql
COPY --chown=nextjs:nodejs ./drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Copy package.json for dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

# Copy startup scripts
COPY --chown=root:root ./docker-entrypoint.sh /app/docker-entrypoint.sh
COPY --chown=root:root ./init-postgres.sh /app/init-postgres.sh
COPY --chown=root:root ./configure-postgres.sh /app/configure-postgres.sh
COPY --chown=root:root ./start-postgres.sh /app/start-postgres.sh
COPY --chown=root:root ./migrate-database.sh /app/migrate-database.sh
COPY --chown=root:root ./health-check.sh /app/health-check.sh
RUN chmod +x /app/docker-entrypoint.sh /app/init-postgres.sh /app/configure-postgres.sh /app/start-postgres.sh /app/migrate-database.sh /app/health-check.sh

# Create PostgreSQL user and directories
RUN adduser -D -s /bin/sh postgres || true
RUN mkdir -p /var/lib/postgresql/data /var/run/postgresql /var/log/postgresql
RUN chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql /var/log/postgresql

# Initialize PostgreSQL database
RUN su-exec postgres initdb -D /var/lib/postgresql/data

# Create Redis directories
RUN mkdir -p /var/lib/redis /var/log/redis
RUN chown -R redis:redis /var/lib/redis /var/log/redis || true

# Create supervisor directories
RUN mkdir -p /var/log/supervisor /etc/supervisor/conf.d

# Install netcat for service checks
RUN apk add --no-cache netcat-openbsd

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=120s --retries=3 \
    CMD /app/health-check.sh || exit 1

# Copy supervisor configuration
COPY --chown=root:root ./supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Don't switch to nextjs user yet - supervisor needs root privileges

# Start supervisor to manage all services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]