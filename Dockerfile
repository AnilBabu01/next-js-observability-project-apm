# =========================================================
# Stage 1: Base
# =========================================================
FROM node:20-alpine AS base

WORKDIR /app


# =========================================================
# Stage 2: Dependencies
# =========================================================
FROM base AS deps

COPY package*.json ./

RUN npm ci


# =========================================================
# Stage 3: Build
# =========================================================
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build


# =========================================================
# Stage 4: Production
# =========================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy standalone Next.js application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]