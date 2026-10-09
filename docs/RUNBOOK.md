# Эксплуатационная инструкция

Команды выполняются из корня репозитория. В PowerShell вместо `grep` используйте `Select-String`.

## Где смотреть состояние

| Что | Где |
|---|---|
| Состояние контейнеров | `docker compose ps -a` |
| Живость процесса (без проверки БД) | `curl http://localhost/api/health/live` (`200` — API отвечает) |
| Готовность сервиса | `curl http://localhost/api/health/ready` (`200` — всё в порядке, `503` — БД недоступна) |
| Логи приложения | `docker compose logs -f api` (JSON, по строке на запрос и событие) |
| Логи Nginx | `docker compose logs -f nginx` (в строке есть `rid=<requestId>`) |
| Логи миграций | `docker compose logs migrate` |
| Метрики (сырые) | `curl -u <METRICS_USER>:<METRICS_PASSWORD> http://localhost/metrics` |
| Дашборд | `http://localhost:3001` → Equipment Maintenance Service |
| Алерты | Grafana → Alerting → Alert rules |

Уровень логов задаётся `LOG_LEVEL` в `.env` (`debug`, `info`, `warn`, `error`); после изменения: `docker compose up -d api`. При `LOG_LEVEL=error` записи `logger.warn` о повторных попытках подключения к БД скрыты.

### Найти запись в логах по requestId

Клиент получает `requestId` в теле любой ошибки и в заголовке `X-Request-Id`.

```bash
docker compose logs api  | grep <requestId>
docker compose logs nginx | grep <requestId>
```

Строка запроса содержит `method`, `path`, `statusCode`, `durationMs`. Непредвиденные ошибки (`500`) логируются уровнем `error` с полным стеком, клиенту стек не отдаётся.

Быстрый поиск ошибок сервера:

```bash
docker compose logs api | grep '"statusCode":5'
docker compose logs api | grep '"level":50'
```

## Типовые отказы

### 1. Недоступна база данных

**Признаки:** `/api/health/ready` отвечает `503` (`database: down`), в логах `api` ошибки подключения, запросы к данным возвращают `500`, прикладные панели Grafana пустые, `/api/health/live` при этом `200` (процесс жив).

**Действия:**

1. `docker compose ps db` — работает ли контейнер, healthy ли он.
2. `docker compose logs --tail=100 db` — причина падения (нехватка места, повреждённый том, неверные переменные).
3. Если контейнер остановлен: `docker compose up -d db`. Приложение переподключается к БД само (пул Sequelize), перезапуск `api` обычно не нужен; убедитесь, что `/api/health/ready` снова `200`.
4. Если БД не стартует из-за места на диске — см. пункт 3.
5. Не используйте `docker compose down -v`: это удалит данные.

### 2. Рост доли ответов 5xx

**Признаки:** сработал алерт `High 5xx error ratio` (доля 5xx > 5% в течение 5 минут), на дашборде растёт панель «4xx / 5xx».

**Действия:**

1. Определите маршрут: на дашборде панель «Интенсивность запросов» по `route`, либо `docker compose logs api | grep '"statusCode":5'`.
2. Возьмите `requestId` из ответа клиента или лога и найдите полную цепочку (см. выше).
3. Проверьте зависимости: `curl http://localhost/api/health/ready`, `docker compose ps`.
4. Если 5xx приходят с маршрута `/api/equipment/:id/weather` и коды `WEATHER_TIMEOUT` / `WEATHER_UNAVAILABLE` — недоступен внешний погодный API (Open-Meteo). Сервис работает корректно (`503` с понятным сообщением), остальные эндпоинты не затронуты; ждите восстановления внешнего сервиса. Эти ответы входят в долю 5xx и могут вызвать алерт без неисправности самого приложения.
5. Если `INTERNAL_ERROR` — читайте стек в логах `api` по `requestId`; после недавнего обновления откатите образ на предыдущую версию (`git checkout <тег>`, `docker compose up -d --build`).
6. После устранения убедитесь, что доля 5xx вернулась в норму, алерт перешёл в `Normal`.

### 3. Переполнение диска

**Признаки:** `No space left on device` в логах `db`, `prometheus` или `grafana`; контейнеры перезапускаются; запись в БД падает.

**Действия:**

1. `docker system df` и `docker volume ls` — что занимает место; размер тома БД: `docker compose exec db du -sh /var/lib/postgresql`.
2. Освободите место, не трогая тома с данными: `docker image prune -f`, `docker builder prune -f`.
3. Логи контейнеров по умолчанию в Docker не ротируются. Ограничьте их в `compose.yaml` для каждого сервиса:
   ```yaml
   logging:
     driver: json-file
     options:
       max-size: "10m"
       max-file: "3"
   ```
4. Данные Prometheus растут со временем; ограничьте срок хранения, добавив в запуск `--storage.tsdb.retention.time=15d`.
5. Перед рискованными операциями сделайте резервную копию БД (ниже).

### 4. Не стартует `api`

Если `api` не поднимается, а `migrate` завершился ошибкой, развёртывание остановлено намеренно:

```bash
docker compose logs migrate
```

Исправьте причину (чаще всего — недоступная БД, неверный пароль, пустые `SEED_*` переменные) и повторите `docker compose up -d`. Применённые миграции повторно не выполняются.

## Резервная копия и восстановление БД

```bash
# копия
docker compose exec -T db pg_dump -U <POSTGRES_USER> <POSTGRES_DB> > backup.sql

# восстановление в чистую БД
docker compose exec -T db psql -U <POSTGRES_USER> <POSTGRES_DB> < backup.sql
```

## Откат миграций

Откат удаляет данные в затронутых таблицах — сначала сделайте резервную копию.

```bash
# откатить последнюю миграцию (внутри Compose)
docker compose run --rm migrate node_modules/.bin/sequelize-cli db:migrate:undo

# откатить все миграции
docker compose run --rm migrate node_modules/.bin/sequelize-cli db:migrate:undo:all

# статус миграций
docker compose run --rm migrate node_modules/.bin/sequelize-cli db:migrate:status
```

Сиды откатываются раньше схемы:

```bash
docker compose run --rm migrate node_modules/.bin/sequelize-cli db:seed:undo:all
docker compose run --rm migrate node_modules/.bin/sequelize-cli db:migrate:undo:all
```

Накатить заново: `docker compose up -d` (сервис `migrate` применит миграции и сиды). Полностью чистое окружение: `docker compose down -v && docker compose up -d --build`.

С хоста (режим разработки) те же команды выполняются как `npx sequelize-cli ...` или `npm run db:migrate` / `npm run db:seed`.

## Алерт `High 5xx error ratio`

**Условие:** доля ответов 5xx от всех запросов > 5% в течение 5 минут. **Серьёзность:** critical.

**Порядок действий:** следуйте разделу «Рост доли ответов 5xx». Минимум: определить маршрут, найти `requestId` в логах, проверить `/api/health/ready` и состояние зависимостей, устранить причину, дождаться возврата алерта в `Normal`.

Проверить срабатывание на стенде можно потоком ошибок:

```bash
for i in $(seq 1 50); do curl -s -o /dev/null http://localhost/api/equipment/not-a-uuid; done
```

Такие запросы дают `4xx`, а не `5xx`; для настоящей проверки алерта остановите БД (`docker compose stop db`) и отправьте несколько запросов к данным с валидным токеном: ответы будут `500`, через 5 минут правило перейдёт в `Firing`. Верните БД командой `docker compose start db`.
