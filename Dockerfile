FROM node:22-slim AS builder
WORKDIR /app
COPY apps/api/dist/ ./
RUN npm ci --omit=dev

FROM node:22-slim
WORKDIR /app
COPY --from=builder /app ./
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "index.js"]
