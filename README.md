# Smart Mock API

![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5.8-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![CI](https://github.com/gatzxx/smart-mock-api/actions/workflows/ci.yml/badge.svg)

Schema-driven mock-сервер для фронтенда: эндпoинты в `schema.json`, данные через [Faker.js](https://fakerjs.dev/).

## Live Demo

| | |
|---|---|
| **UI** | https://smart-mock-ui.vercel.app |
| **API** | https://smart-mock-api.onrender.com/api/users |
| **Meta** | https://smart-mock-api.onrender.com/__meta |
| **OpenAPI** | https://smart-mock-api.onrender.com/openapi.json |

Демо-фронт: [smart-mock-ui](https://github.com/gatzxx/smart-mock-ui) · GitHub: [smart-mock-api](https://github.com/gatzxx/smart-mock-api)

![Demo UI](docs/demo.png)

> Скриншот в README статичный. Live demo всегда актуальна по ссылке UI.

## Зачем

Фронтенд блокируется отсутствием бэкенда, нельзя проверить loading, error и retry. Новый эндпoинт добавляется **только в JSON**, без правки TypeScript. Задержка ответа через `.env` для отработки UX на UI.

## Ограничения runtime

| Ограничение | Поведение |
|-------------|-----------|
| **In-memory store** | CRUD-данные (`users`, `products`) хранятся в RAM. Нет PostgreSQL, Redis, файловой персистентности |
| **Cold start (Render)** | После простоя free-tier инстанс перезапускается. Store и CRUD-записи сбрасываются |
| **Hot reload** | `SCHEMA_HOT_RELOAD=true` только в dev. В production default `false` (см. `loadConfig`) |
| **CRUD scope** | POST/PATCH/DELETE только для store-backed сущностей в `schema.json` (сейчас: users, products) |
| **Auth** | Нет. Mock для локальной разработки и demo |

При hot reload или restart in-memory store **полностью сбрасывается**.

## Быстрый старт

```bash
cp .env.example .env
npm install
npm run dev
```

http://localhost:3000

```bash
docker compose up --build
```

## CRUD API

Store-backed entities поддерживают полный цикл:

| Метод | Users | Products |
|-------|-------|----------|
| `GET` list | `/api/users` | `/api/products` |
| `GET` detail | `/api/users/:id` | `/api/products/:id` |
| `POST` create | `/api/users` → 201 | `/api/products` → 201 |
| `PATCH` update | `/api/users/:id` → 200 | `/api/products/:id` → 200 |
| `DELETE` | `/api/users/:id` → 200 | `/api/products/:id` → 200 |

Ошибки мутаций: `{ "error": "string" }` (400/404/500). GET detail enrich: avatar/bio для users, description для products.

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Demo","email":"demo@example.com","role":"Engineer"}'
```

## OpenAPI и Meta

| Endpoint | Описание |
|----------|----------|
| `GET /__meta` | Discovery: routes, methods, `schemaVersion`, `openapiPath` |
| `GET /openapi.json` | OpenAPI 3.1 spec, сгенерирован из `schema.json` |

## Примеры

```bash
curl http://localhost:3000/api/users
curl http://localhost:3000/api/users/42
curl http://localhost:3000/__meta
curl http://localhost:3000/openapi.json
curl http://localhost:3000/unknown
```

## Конфигурация

Переменные из `.env.example`:

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `3000` | Порт HTTP-сервера |
| `SCHEMA_PATH` | `./schema.json` | Путь к схеме |
| `RESPONSE_DELAY_MS` | `0` | Задержка ответа (мс, max 30000), для loading на UI |
| `SCHEMA_HOT_RELOAD` | `true` в dev, `false` в production | Перезагрузка schema.json без restart (store сбрасывается) |
| `CORS_ORIGIN` | `http://localhost:5173` | Origins через запятую |

## Добавить эндпoинт

Только `schema.json`. В dev (`npm run dev`) с `SCHEMA_HOT_RELOAD=true` сервер подхватит изменения без restart. In-memory store сбрасывается при reload.

```json
{
  "path": "/orders",
  "response": {
    "kind": "collection",
    "count": 5,
    "item": {
      "id": "uuid",
      "status": "commerce.productAdjective",
      "amount": "commerce.price",
      "customerName": "person.fullName"
    }
  }
}
```

`GET /api/orders` появится автоматически. CRUD (POST/PATCH/DELETE) требует блок `store` в endpoint.

**Ответы:** `collection` · `object` · Faker: `person.fullName`, shorthand `uuid`, `literal.ok`

## Скрипты

| Команда | Действие |
|---------|----------|
| `npm run dev` | Dev-сервер |
| `npm run check` | typecheck + lint + format + test |
| `npm test` | Unit-тесты |
| `npm run build` | Сборка |
| `npm start` | Production |

## Связанные репозитории

- [smart-mock-ui](https://github.com/gatzxx/smart-mock-ui) - React admin demo (CRUD, TanStack Query, Meta UI)

## Стек

Hono · Zod · Faker · Vitest · ESLint · Docker · GitHub Actions

## Лицензия

MIT
