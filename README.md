# Equipment Maintenance API

REST API на Express для учёта заявок на техническое обслуживание оборудования производственной площадки (ветропарк). Сервис ведёт справочник оборудования, заявки на его обслуживание, контролирует жизненный цикл заявки и оценивает погодные условия перед планированием наружных работ.

## Требования к окружению

- Node.js 20+
- npm 10+

## Установка и запуск

```bash
git clone <URL этого репозитория>
cd equipment-maintenance-api
npm install
cp .env.example .env
npm run dev
```

Сервер стартует на порту из `.env` (по умолчанию `3000`). Проверка: `curl http://localhost:3000/api/health`.

Данные хранятся в JSON-файлах в папке `data/` (создаётся автоматически при первом запуске, не коммитится в git).

## Переменные окружения

| Переменная | Назначение | Пример |
|---|---|---|
| `PORT` | Порт сервера | `3000` |
| `NODE_ENV` | Режим (`development`/`production`) — в production скрываются внутренние сообщения 500-ошибок | `development` |
| `CORS_ORIGINS` | Разрешённые origin через запятую | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Окно ограничения частоты запросов, мс | `60000` |
| `RATE_LIMIT_MAX` | Макс. запросов за окно | `100` |
| `WEATHER_API_URL` | URL погодного API (Open-Meteo forecast) | `https://api.open-meteo.com/v1/forecast` |
| `REQUEST_TIMEOUT_MS` | Таймаут запроса к внешнему API | `5000` |
| `WEATHER_MAX_PRECIPITATION_MM` | Порог осадков для пригодности окна работ | `0` |
| `WEATHER_MAX_WIND_SPEED_KMH` | Порог скорости ветра | `20` |


## Эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/health` | Проверка доступности сервиса |
| GET | `/api/equipment` | Список оборудования (фильтры: `type`, `status`; сортировка `sort`; пагинация `page`, `limit`) |
| POST | `/api/equipment` | Создание оборудования |
| GET | `/api/equipment/:id` | Карточка оборудования |
| PATCH | `/api/equipment/:id` | Частичное обновление |
| DELETE | `/api/equipment/:id` | Удаление (409, если есть незакрытые заявки) |
| GET | `/api/equipment/:id/requests` | Заявки по конкретной единице оборудования |
| GET | `/api/equipment/:id/weather` | Прогноз погоды и пригодность окна для наружных работ |
| GET | `/api/requests` | Список заявок (фильтры: `status`, `priority`, `equipmentId`, `dateFrom`, `dateTo`; сортировка; пагинация) |
| POST | `/api/requests` | Создание заявки |
| GET | `/api/requests/:id` | Карточка заявки |
| PATCH | `/api/requests/:id` | Редактирование полей заявки (без смены статуса) |
| PATCH | `/api/requests/:id/status` | Смена статуса с проверкой допустимости перехода |
| DELETE | `/api/requests/:id` | Удаление заявки |

Списочные эндпоинты возвращают `{ data: [...], meta: { total, page, limit } }`.

## Модель данных

### Equipment

| Поле | Тип | Примечание |
|---|---|---|
| `id` | string (uuid) | генерируется сервером |
| `name` | string, 3–100 симв. | обязательное |
| `type` | `turbine \| inverter \| sensor \| substation` | |
| `serialNumber` | string | уникален в системе |
| `location` | `{ lat: number, lon: number }` | |
| `status` | `operational \| maintenance \| fault \| decommissioned` | |
| `installedAt` | ISO-дата | не в будущем |
| `createdAt`, `updatedAt` | ISO-дата-время | проставляются сервером |

### Maintenance Request

| Поле | Тип | Примечание |
|---|---|---|
| `id` | string (uuid) | генерируется сервером |
| `equipmentId` | string (uuid) | ссылка на существующее оборудование |
| `title` | string, 5–120 симв. | обязательное |
| `description` | string, до 2000 симв. | необязательное |
| `priority` | `low \| medium \| high \| critical` | |
| `status` | `new \| in_progress \| done \| rejected` | по умолчанию `new`, меняется только через `PATCH /:id/status` |
| `plannedAt` | ISO-дата-время | необязательное |
| `createdAt`, `updatedAt` | ISO-дата-время | проставляются сервером |

## Схема переходов статуса заявки

```mermaid
stateDiagram-v2
    [*] --> new
    new --> in_progress
    new --> rejected
    in_progress --> done
    in_progress --> rejected
    done --> [*]
    rejected --> [*]
```

Из статусов `done` и `rejected` переходы запрещены. Попытка недопустимого перехода — `409 CONFLICT`.


## Формат ответа об ошибке

Все ошибки API возвращаются в едином формате:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные запроса",
    "details": [
      { "field": "priority", "message": "Invalid enum value" }
    ],
    "requestId": "b1f2c3d4"
  }
}
```

`details` присутствует только для ошибок валидации. `requestId` возвращается в каждом ответе об ошибке и в заголовке `X-Request-Id` любого ответа — по нему можно найти соответствующую запись в логах сервера.

| Код ошибки | HTTP-статус | Когда возникает |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Некорректные данные в body/params/query |
| `NOT_FOUND` | 404 | Сущность или маршрут не найдены |
| `CONFLICT` | 409 | Дубль serialNumber, удаление equipment с открытыми заявками, недопустимый переход статуса |
| `INVALID_TRANSITION` | 409 | Попытка недопустимого перехода статуса заявки |
| `RATE_LIMIT_EXCEEDED` | 429 | Превышен лимит запросов |
| `WEATHER_TIMEOUT` / `WEATHER_UNAVAILABLE` | 503 | Внешний погодный API не ответил вовремя или недоступен |
| `INTERNAL_ERROR` | 500 | Непредвиденная ошибка сервера (детали скрыты в production) |

**Почему 422, а не 400, для ошибок валидации**: 400 используется для синтаксически некорректных запросов (например, невалидный JSON), 422 — когда синтаксис верный, но содержимое не проходит бизнес-проверки схемы (обязательные поля, enum-значения, форматы). Этот выбор зафиксирован и последовательно применяется во всём API.

## Примеры запросов и ответов

### Создание оборудования

Запрос:
```http
POST /api/equipment
Content-Type: application/json

{
  "name": "Turbine A",
  "type": "turbine",
  "serialNumber": "SN-001",
  "location": { "lat": 60.1, "lon": 24.9 },
  "status": "operational",
  "installedAt": "2024-01-01"
}
```

Ответ `201 Created` (заголовок `Location: /api/equipment/<id>`):
```json
{
  "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  "name": "Turbine A",
  "type": "turbine",
  "serialNumber": "SN-001",
  "location": { "lat": 56.50049, "lon": 84.98216 },
  "status": "operational",
  "installedAt": "2024-01-01",
  "createdAt": "2026-09-20T10:00:00.000Z",
  "updatedAt": "2026-09-20T10:00:00.000Z"
}
```

### Ошибка валидации

Запрос:
```http
POST /api/equipment
Content-Type: application/json

{ "type": "turbine" }
```

Ответ `422 Unprocessable Entity`:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные запроса",
    "details": [
      { "field": "name", "message": "Required" },
      { "field": "serialNumber", "message": "Required" },
      { "field": "location", "message": "Required" },
      { "field": "status", "message": "Required" },
      { "field": "installedAt", "message": "Required" }
    ],
    "requestId": "a1b2c3d4"
  }
}
```

### Недопустимый переход статуса

Запрос:
```http
PATCH /api/requests/<id>/status
Content-Type: application/json

{ "status": "done" }
```

(если текущий статус заявки — `new`)

Ответ `409 Conflict`:
```json
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Переход из \"new\" в \"done\" недопустим",
    "requestId": "e5f6a7b8"
  }
}
```

## Безопасность

### CORS
Разрешённые источники задаются явным списком через переменную окружения `CORS_ORIGINS` (через запятую), `*` не используется. Запросы без заголовка `Origin` (curl, Postman, серверные вызовы) разрешены — иначе тестирование через Postman было бы невозможно.

### Rate limiting
Все маршруты `/api/*`, кроме `/api/health`, ограничены по частоте запросов (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`). При превышении — `429` с заголовками `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`. `/api/health` не ограничен, чтобы не мешать мониторингу.

### Прочее
- `helmet()` — стандартный набор защитных HTTP-заголовков.
- Тело запроса ограничено 100kb (`express.json({ limit: '100kb' })`).
- Секреты и параметры окружения не коммитятся — в репозитории только `.env.example`.
- В `NODE_ENV=production` в ответах об ошибках скрываются внутренние сообщения и стек-трейсы непредвиденных (500) ошибок.

## Архитектура и структура проекта

Слоистая архитектура: **маршруты → контроллеры → сервисы → репозитории**. Бизнес-логика находится только в сервисах; репозитории — единственный слой, знающий о формате хранения данных (сейчас — JSON-файлы в `data/`, на Неделе 3 заменяется на Sequelize/PostgreSQL без изменений в сервисах и контроллерах).

```
src/
  app.js              # сборка приложения (используется в тестах)
  server.js           # запуск сервера, отделён от app.js
  routes/             # объявление путей, без бизнес-логики
  controllers/        # разбор req/res, вызов сервисов
  services/           # бизнес-логика, включая statusTransitions.js и weatherService.js
  repositories/       # доступ к данным (JSON-файлы через storage/jsonFileStore.js)
  middlewares/        # requestId, validate, errorHandler, notFoundHandler
  validators/         # Zod-схемы для body/params/query
  errors/             # AppError и наследники (NotFoundError, ConflictError, ValidationError, ServiceUnavailableError)
  config/             # corsConfig.js, rateLimitConfig.js, weatherConfig.js
data/                 # runtime-данные (не в git)
docs/postman/         # экспортированная Postman-коллекция
```

## Особенности реализации на Express 5

- Async-обработчики в Express 5 автоматически передают отклонённые промисы в error-handler (эквивалент `next(err)`), поэтому кастомный `asyncHandler`/`express-async-errors` не используется — все контроллеры представляют собой простые `async function`.
- `req.query` в Express 5 — read-only геттер. Результат валидации query-параметров кладётся не обратно в `req.query`, а в `req.valid.query`; то же самое, из соображений единообразия, сделано и для `req.valid.body`/`req.valid.params`.
