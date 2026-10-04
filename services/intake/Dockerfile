FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile && pnpm store prune
COPY src ./src
USER node
EXPOSE 3000
CMD ["node", "src/server.mjs"]
