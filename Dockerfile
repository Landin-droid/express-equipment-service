#установка зависимостей и подготовка кода
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# dev-зависимости
FROM base AS dev-deps
RUN npm ci

# продакшн-зависимости
FROM base AS prod-deps
RUN npm ci --omit=dev

# финальный образ
FROM node:20-alpine AS runtime
WORKDIR /app

# В официальном образе node:*-alpine уже есть
# пользователь "node", поэтому можно использовать
# его для запуска приложения
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node .sequelizerc ./
COPY --chown=node:node scripts/ ./scripts/
COPY --chown=node:node src/ ./src/
COPY --chown=node:node public/ ./public/
COPY --chown=node:node docs/ ./docs/
COPY --chown=node:node .env.example ./

RUN mkdir -p data && chown node:node data

USER node

EXPOSE 3000

CMD ["node", "src/server.js"]