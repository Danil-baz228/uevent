# Uevent

`Uevent` — це full-stack застосунок для пошуку подій, знайомства людей зі схожими інтересами та створення власних спільнот.

У репозиторії вже підготовлено стартовий монорепозиторій:

- `apps/api` — backend на NestJS
- `apps/web` — frontend на React + Vite

## Технології

- React + TypeScript
- Vite
- NestJS
- PostgreSQL
- TypeORM
- Swagger
- Stripe
- Docker Compose

## Структура проєкту

```text
apps/
  api/   backend на NestJS
  web/   frontend на React + Vite
```

## Що потрібно для запуску

- Node.js `20+`
- npm `10+`
- Docker Desktop або локальний PostgreSQL, якщо хочеш запуск із реальною БД

## Важливо для Windows PowerShell

У Windows PowerShell команда `npm` може блокуватись через policy скриптів. Якщо бачиш помилку на кшталт `npm.ps1 cannot be loaded`, використовуй:

```powershell
npm.cmd install
```

Аналогічно замість `npm run ...` можна запускати:

```powershell
npm.cmd run dev:web
npm.cmd run dev:api
```

## Налаштування `.env`

Спочатку створи локальні `.env` файли:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

## Швидкий запуск без PostgreSQL

Цей режим підходить, якщо ти хочеш просто підняти фронт і API-скелет без реальноï бази даних.

### 1. Встанови залежності

```powershell
npm.cmd install
```

### 2. Увімкни режим без БД

У файлі `apps/api/.env` постав:

```env
DATABASE_ENABLED=false
```

### 3. Запусти backend

```powershell
npm.cmd run dev:api
```

Backend буде доступний тут:

- API: `http://localhost:4000/api`
- health-check: `http://localhost:4000/api/health`
- Swagger: `http://localhost:4000/api/docs`

### 4. Запусти frontend

В іншому терміналі:

```powershell
npm.cmd run dev:web
```

Frontend буде доступний тут:

- `http://localhost:5173`

## Повний запуск з PostgreSQL

Якщо хочеш запускати проєкт із реальною БД, є два варіанти:

- через Docker Compose
- через вже встановлений локальний PostgreSQL

### Варіант 1. Через Docker Compose

#### 1. Переконайся, що встановлений Docker Desktop

Команда для перевірки:

```powershell
docker compose version
```

#### 2. Підніми PostgreSQL

```powershell
docker compose up -d
```

#### 3. Увімкни БД у `apps/api/.env`

```env
DATABASE_ENABLED=true
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=uevent
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

#### 4. Запусти API і frontend

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

### Варіант 2. Через локальний PostgreSQL

Якщо PostgreSQL уже встановлений локально, перевір, щоб параметри в `apps/api/.env` збігалися з твоїми реальними налаштуваннями:

```env
DATABASE_ENABLED=true
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=uevent
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

Після цього запускай:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

## Команди проєкту

### Кореневі команди

Запуск frontend у dev-режимі:

```powershell
npm.cmd run dev:web
```

Запуск backend у dev-режимі:

```powershell
npm.cmd run dev:api
```

Збірка frontend:

```powershell
npm.cmd run build:web
```

Збірка backend:

```powershell
npm.cmd run build:api
```

Підняти Docker-сервіси:

```powershell
npm.cmd run docker:up
```

Зупинити Docker-сервіси:

```powershell
npm.cmd run docker:down
```

## Як збілдити проєкт

### Збірка всього по черзі

Спочатку backend:

```powershell
npm.cmd run build:api
```

Потім frontend:

```powershell
npm.cmd run build:web
```

### Що буде після збірки

- backend збирається в `apps/api/dist`
- frontend збирається в `apps/web/dist`

## Як запустити після build

### Backend після build

Спочатку збілдь:

```powershell
npm.cmd run build:api
```

Потім запусти з папки `apps/api`:

```powershell
cd apps/api
npm.cmd run start
```

### Frontend після build

Спочатку збілдь:

```powershell
npm.cmd run build:web
```

Для локальної перевірки production-збірки відкрий папку `apps/web` і запусти preview:

```powershell
cd apps/web
npm.cmd run preview
```

За замовчуванням preview піднімається локально через Vite.

## Swagger

Після запуску backend документація Swagger доступна тут:

```text
http://localhost:4000/api/docs
```

## Поточний стан проєкту

У репозиторії вже є стартовий каркас:

- модулі `auth`, `users`, `events`, `payments`, `health` на backend
- стартові сторінки на frontend
- mock-дані для першого інтерфейсу
- конфігурація під PostgreSQL і Docker Compose

## Типовий порядок запуску

Найпростіший сценарій для локальної роботи:

1. Скопіювати `.env` файли.
2. Встановити залежності через `npm.cmd install`.
3. Якщо БД поки не потрібна, поставити `DATABASE_ENABLED=false`.
4. Запустити `npm.cmd run dev:api`.
5. Запустити `npm.cmd run dev:web`.

## Якщо щось не запускається

### PowerShell блокує `npm`

Запускай через `npm.cmd`, а не через `npm`.

### API падає з помилкою підключення до PostgreSQL

Причина майже завжди одна з цих:

- `DATABASE_ENABLED=true`, але PostgreSQL не запущений
- неправильні `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- Docker не піднятий

Якщо хочеш тимчасово запускати без БД, вистав:

```env
DATABASE_ENABLED=false
```

### Не працює Docker

Перевір, що Docker Desktop запущений, і команда:

```powershell
docker compose version
```

відпрацьовує без помилки.

## Що можна робити далі

Наступні логічні кроки:

1. Підключити реальну авторизацію через JWT.
2. Додати міграції та реальні репозиторії TypeORM.
3. Підключити frontend до API замість mock-даних.
4. Реалізувати Stripe checkout для платних подій.
5. Додати тести та CI.
