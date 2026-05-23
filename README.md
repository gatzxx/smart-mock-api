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

Демо-фронт: [smart-mock-ui](https://github.com/gatzxx/smart-mock-ui) · GitHub: [smart-mock-api](https://github.com/gatzxx/smart-mock-api)

![Demo UI](docs/demo.png)

## Зачем

Фронтенд блокируется отсутствием бэкенда, нельзя проверить loading, error и retry. Новый эндпoинт добавляется **только в JSON**, без правки TypeScript. Задержка ответа через `.env` для отработки UX на UI.

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

## Примеры

```bash
curl http://localhost:3000/api/users
curl http://localhost:3000/api/users/42
curl http://localhost:3000/__meta
curl http://localhost:3000/unknown
```

## Конфигурация

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `3000` | Порт HTTP-сервера |
| `SCHEMA_PATH` | `./schema.json` | Путь к схеме |
| `RESPONSE_DELAY_MS` | `0` | Задержка ответа (мс), для loading на UI |
| `CORS_ORIGIN` | см. `.env.example` | Origins через запятую |

## Добавить эндпoинт

Только `schema.json`, перезапуск сервера:

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

`GET /api/orders` появится автоматически.

**Ответы:** `collection` · `object` · Faker: `person.fullName`, shorthand `uuid`, `literal.ok`

## Скрипты

| Команда | Действие |
|---------|----------|
| `npm run dev` | Dev-сервер |
| `npm run check` | typecheck + lint + test |
| `npm test` | Unit-тесты |
| `npm run build` | Сборка |
| `npm start` | Production |

## Стек

Hono · Zod · Faker · Vitest · ESLint · Docker · GitHub Actions

## Лицензия

MIT
