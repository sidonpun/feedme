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

## Получение логов

Чтобы собрать журналы работы сервисов для отладки или передачи в поддержку,
используйте встроенные команды Docker Compose:

* Просмотр последних сообщений сразу обоих контейнеров:

  ```bash
  docker compose logs
  ```

* Получение логов только приложения (service name `server`):

  ```bash
  docker compose logs server
  ```

* Отслеживание логов в реальном времени до прерывания комбинацией `Ctrl+C`:

  ```bash
  docker compose logs -f server
  ```

* Экспорт логов в файл для последующей отправки:

  ```bash
  docker compose logs server > feedme-server.log
  docker compose logs postgres > feedme-postgres.log
  ```

Если имя сервиса в стеке изменили, узнайте актуальный список командой
`docker compose ps --services` и подставьте нужное значение вместо `server` или
`postgres`.

Логи сохраняются в текстовом формате UTF-8, поэтому их можно пересылать через
почту или мессенджер без дополнительной обработки.

