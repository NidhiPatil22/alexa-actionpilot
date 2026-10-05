# Multi-stage build for ActionPilot Remote MCP Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package dependencies
COPY package*.json ./
COPY apps/mcp-server/package*.json ./apps/mcp-server/

RUN npm install --workspace=apps/mcp-server

# Copy server source
COPY apps/mcp-server ./apps/mcp-server

# Build TypeScript
WORKDIR /app/apps/mcp-server
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV MCP_STREAMABLE_HTTP=true
ENV MCP_SPEC_VERSION=2025-11-25

COPY --from=builder /app/apps/mcp-server/dist ./dist
COPY --from=builder /app/apps/mcp-server/package*.json ./
COPY --from=builder /app/apps/mcp-server/node_modules ./node_modules

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
