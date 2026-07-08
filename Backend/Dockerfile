FROM node:22-alpine AS builder

WORKDIR /workspace

COPY . .

WORKDIR /workspace/Backend

RUN npm ci
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /workspace/Backend/package.json ./package.json
COPY --from=builder /workspace/Backend/node_modules ./node_modules
COPY --from=builder /workspace/Backend/dist ./dist

EXPOSE 8080

CMD ["node", "dist/server.js"]
