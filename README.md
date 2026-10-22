# Local Ledger

[Русский](#русский) | [English](#english)

---

<a id="русский"></a>
## Русский

### О проекте

**Local Ledger** — приложение для личного финансового учёта и планирования денежных потоков. Оно помогает отслеживать операции, управлять регулярными платежами и прогнозировать будущий баланс.

**Local — потому что финансовые данные остаются у вас.** Приложение хранит операции и настройки в локальном хранилище браузера и не отправляет финансовые данные на сервер приложения. Для переноса данных между браузерами или создания резервной копии можно использовать экспорт и импорт JSON.

### Возможности

- Учёт фактических, плановых и корректирующих операций.
- Создание и управление периодическими операциями.
- Прогноз баланса на временной шкале с динамическим расширением горизонта прогноза.
- Подтверждение плановых операций.
- Настройка начального баланса и даты его действия.
- Сверка баланса, корректировка расхождений и контрольные точки сверки.
- Импорт и экспорт выбранных наборов данных в формате JSON.

### Технологии

- React
- TypeScript
- Vite
- Tailwind CSS
- i18next
- LocalStorage для локального хранения данных

### Установка и запуск

**Локально в режиме разработки**

Требуются Node.js и pnpm.

```bash
pnpm install
pnpm dev
```

Vite выведет адрес локального сервера в терминале.

**Запуск через Docker**

Требуются Docker и Docker Compose.

```bash
docker compose -f docker/docker-compose.yml up --build -d
```

Откройте [http://localhost:3000](http://localhost:3000).

**Production-сборка**

```bash
pnpm build
```

### Хранение данных и приватность

Данные операций, периодических операций и настройки баланса хранятся в LocalStorage текущего браузера. Серверная синхронизация не используется. Очистка данных браузера может удалить локальные данные, поэтому для резервной копии регулярно экспортируйте их в JSON и храните файл в безопасном месте.

Импорт заменяет только выбранные наборы данных; невыбранные наборы остаются без изменений.

### Статус проекта

Local Ledger находится на стадии **MVP и активно развивается**. Возможности и интерфейс могут изменяться.

---

<a id="english"></a>
## English

### About

**Local Ledger** is a personal finance tracking and cash-flow planning application. It helps you track transactions, manage recurring payments, and forecast your future balance.

**Local means your financial data stays with you.** The app stores transactions and settings in your browser's local storage and does not send financial data to an application server. JSON import and export are available for backups and transferring data between browsers.

### Features

- Track actual, planned, and adjustment transactions.
- Create and manage recurring operations.
- View a balance timeline with a forecast horizon that extends dynamically.
- Confirm planned transactions.
- Configure the opening balance and its effective date.
- Reconcile balances, adjust discrepancies, and maintain reconciliation checkpoints.
- Import and export selected datasets as JSON.

### Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- i18next
- LocalStorage for local data persistence

### Installation and Usage

**Run locally in development mode**

Node.js and pnpm are required.

```bash
pnpm install
pnpm dev
```

Vite prints the local development server URL in the terminal.

**Run with Docker**

Docker and Docker Compose are required.

```bash
docker compose -f docker/docker-compose.yml up --build -d
```

Open [http://localhost:3000](http://localhost:3000).

**Production build**

```bash
pnpm build
```

### Data Storage and Privacy

Transactions, recurring operations, and balance settings are stored in the current browser's LocalStorage. Server-side synchronization is not used. Clearing browser data may delete locally stored information, so export JSON backups regularly and keep them somewhere safe.

Import replaces only the selected datasets; unselected datasets remain unchanged.

### Project Status

Local Ledger is an **evolving MVP**. Features and the user interface may change as development continues.
