# Пифагор — сайт + CRM

Монорепозиторий образовательной платформы **«Пифагор»**:

| Часть | Путь | Описание |
|---|---|---|
| **Маркетинговый сайт** | `frontend/` | React + Vite — лендинг, предметы, репетиторы, заявки |
| **CRM / API** | `backend/` | FastAPI + PostgreSQL — личный кабинет, расписание, оплаты |

## Архитектура

```
Браузер
   │
   ├─► http://localhost:5173   — маркетинговый сайт (Vite)
   │         │
   │         └── /api/* ──proxy──► FastAPI :8000
   │
   └─► http://localhost:8000   — личный кабинет (CRM SPA) + REST API
```

**Маркетинговый сайт** загружает данные из CRM через REST API:
- репетиторы, цены, FAQ, отзывы
- заявки на пробное занятие и набор репетиторов

**Личный кабинет** — встроенное SPA в backend (`backend/app/static/index.html`):
- роли: администратор, репетитор, родитель, ученик
- расписание, домашние задания, отчёты, оплаты, договоры

---

## Быстрый старт

### 1. Запустить CRM (backend + PostgreSQL)

```bash
docker compose up --build
```

API и личный кабинет: **http://localhost:8000**  
Swagger: **http://localhost:8000/docs**

### 2. Заполнить базу тестовыми данными

В отдельном терминале (после старта контейнеров):

```bash
docker compose exec backend python seed.py
```

Тестовые аккаунты:

| Email | Пароль | Роль |
|---|---|---|
| admin@pifagor.ru | admin123 | Администратор |
| tutor@pifagor.ru | tutor123 | Репетитор |
| parent@pifagor.ru | parent123 | Родитель |
| child@pifagor.ru | child123 | Ученик |

### 3. Запустить маркетинговый сайт

```bash
cd frontend
npm install
npm run dev
```

Сайт: **http://localhost:5173**

Vite проксирует `/api` на `http://localhost:8000`, поэтому отдельная настройка CORS для разработки не нужна.

---

## Переменные окружения

### Frontend (`frontend/.env.local`)

```env
# Пусто в dev — используется Vite proxy
VITE_API_BASE_URL=

# URL личного кабинета (кнопка «Личный кабинет» в шапке)
VITE_CRM_URL=http://localhost:8000
```

### Backend (docker-compose / `.env`)

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://pifagor:pifagor_pass@db:5432/pifagor` | PostgreSQL |
| `SECRET_KEY` | — | JWT-подпись |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | TTL access-токена |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | TTL refresh-токена |
| `EMAIL_USER` / `EMAIL_PASSWORD` | — | IMAP для парсинга чеков EasyPay |
| `LESSON_PRICE` | `80` | Стоимость занятия для email-парсера |

---

## Интеграция frontend ↔ CRM

| Данные на сайте | API endpoint | Метод |
|---|---|---|
| Заявка на пробное / репетиторство | `/api/v1/requests` | POST |
| Список репетиторов | `/api/v1/users/tutors/public` | GET |
| Цены | `/api/v1/prices` | GET |
| FAQ | `/api/v1/faq` | GET |
| Отзывы | `/api/v1/reviews` | GET |
| Предметы | `/api/v1/subjects` | GET |
| Личный кабинет | `http://localhost:8000` | — |

Код интеграции:

```
frontend/src/
├── api/           — HTTP-клиент и вызовы API
├── hooks/         — useSubjects, useTutors, useFaq, …
├── components/
│   ├── BookingForm.tsx          — форма заявки
│   └── TutorApplicationForm.tsx — заявка репетитора
└── config.ts      — VITE_API_BASE_URL, VITE_CRM_URL
```

При недоступности API сайт показывает статические fallback-данные (репетиторы, FAQ, скриншоты отзывов).

---

## Production

### Backend

```bash
docker compose up -d --build
```

### Frontend

```bash
cd frontend
npm run build
```

Собранные файлы — в `frontend/dist/`. Варианты деплоя:

1. **Отдельный хостинг** (Netlify, Vercel, nginx) — задайте `VITE_API_BASE_URL=https://api.yourdomain.com`
2. **За reverse proxy** — проксируйте `/api` на backend, а статику отдавайте из `dist/`

---

## Структура репозитория

```
пифагор/
├── frontend/                       # React маркетинговый сайт
│   ├── src/
│   ├── vite.config.ts              # proxy /api → :8000
│   └── .env.example
├── backend/                        # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── api/v1/endpoints/       # REST API
│   │   ├── static/index.html       # CRM SPA
│   │   └── main.py
│   ├── seed.py
│   └── README.md                   # Документация API
├── docker-compose.yml
├── .env
└── README.md                       # этот файл
```

---

## Полезные команды

```bash
# Проверить health API
curl http://localhost:8000/health

# Список репетиторов
curl http://localhost:8000/api/v1/users/tutors/public

# Отправить заявку
curl -X POST http://localhost:8000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{"name":"Иван","phone":"+375291234567","message":"Математика"}'

# Сборка frontend
cd frontend && npm run build
```

---

## Дополнительно

- Подробное описание API: [`backend/README.md`](backend/README.md)
- Alembic-миграции: `backend/alembic/` (схема также создаётся автоматически при старте)
