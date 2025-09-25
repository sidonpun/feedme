# FeedMe — развёртывание в Docker

Ниже описан минимальный и воспроизводимый способ собрать production-образ,
запустить сервер вместе с PostgreSQL и убедиться, что встроенный Angular-фронт
корректно работает через тот же HTTP-ендпойнт.

## Предварительные требования

* Docker 24+ и Docker Compose v2.
* Открытый TCP-порт `8080` на хосте, где будут запускаться контейнеры.

## Структура репозитория

* `Dockerfile` — мультистейдж-образ, собирающий Angular-фронт и .NET backend.
* `docker-compose.yml` — оркестрация backend + PostgreSQL.
* `feedme.client/src/environments` — конфигурации Angular. Production-сборка
  теперь по умолчанию использует origin браузера, поэтому фронт автоматически
  подключается к тому же домену, откуда был загружен.

## Сборка production-образа

```bash
docker compose build server
```

Команда выполнит `npm ci`, `ng build`, затем `dotnet publish` и соберёт финальный
слой с ASP.NET Core приложением, статикой Angular и миграциями БД.

## Запуск стека

```bash
docker compose up -d
```

Compose поднимет два контейнера:

* `feedme-postgres` — PostgreSQL 16 с базой `feedme` и пользователем `feedme`.
* `feedme-server` — ASP.NET Core 9.0 с включёнными автоматическими миграциями,
  доступный на `http://localhost:8080`.

Backend ждёт инициализации БД через `depends_on` с healthcheck и стартует только
после того, как PostgreSQL готов к работе.

## Проверка работы

1. Откройте `http://localhost:8080` в браузере. Angular-приложение загрузится
   из того же контейнера.
2. Любые API-запросы отправляются на origin страницы, поэтому дополнительных
   настроек CORS не требуется.
3. Для проверки здоровья сервера используйте `http://localhost:8080/health`.

## Настройка под своё окружение

Все параметры БД пробрасываются через переменные окружения `Database__*` в
контейнере `feedme-server`. При необходимости измените их в `docker-compose.yml`
или прокиньте через `.env`:

```env
Database__Password=secure-password
POSTGRES_PASSWORD=secure-password
```

Если фронт должен ходить на внешний API, перед сборкой Angular пропишите
абсолютный адрес в `feedme.client/src/environments/environment.prod.ts`,
указав `apiBaseUrl`. При отсутствии этого параметра используется origin
страницы.

## Остановка и очистка

```bash
docker compose down
```

Чтобы удалить данные PostgreSQL, добавьте `-v` к команде выше.

