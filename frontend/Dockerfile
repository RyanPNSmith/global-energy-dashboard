# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runtime
WORKDIR /app

# Add non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Only copy necessary artifacts from the standalone output
COPY --from=build --chown=1001:1001 /app/.next/standalone ./
COPY --from=build --chown=1001:1001 /app/.next/static ./.next/static
COPY --from=build --chown=1001:1001 /app/public ./public

# Ensure Next.js can write its incremental cache at runtime
RUN mkdir -p .next/cache && chown 1001:1001 .next/cache

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER 1001
CMD ["node", "server.js"]