#!/usr/bin/env bash
#
# Скрипт установки и запуска Feedme Angular
# Поместить в корень feedme.client и выполнить: ./install.sh [--clean] [--start]
#

set -euo pipefail

# Параметры
CLEAN=false
START=false

function usage() {
  cat <<EOF
Использование: $0 [опции]

Опции:
  -h, --help      Показать это сообщение
  -c, --clean     Удалить node_modules и package-lock.json перед установкой
  -s, --start     Запустить dev-сервер после установки
EOF
  exit 0
}

# Парсим флаги
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage ;;
    -c|--clean) CLEAN=true; shift ;;
    -s|--start) START=true; shift ;;
    *) echo "Неизвестная опция: $1"; usage ;;
  esac
done

# Переходим в каталог приложения, если скрипт запущен из корня репозитория
if [[ ! -f "angular.json" && -d "feedme.client" ]]; then
  echo "Переходим в каталог feedme.client..."
  cd feedme.client
fi

# Проверка версий Node.js и npm
command -v node >/dev/null 2>&1 || { echo "Ошибка: Node.js не установлен."; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "Ошибка: npm не установлен.";   exit 1; }

NODE_MAJOR=$(node -v | cut -d. -f1 | tr -d 'v')
if (( NODE_MAJOR < 16 )); then
  echo "Требуется Node.js ≥ 16, у вас $(node -v)"; exit 1
fi

NPM_MAJOR=$(npm -v | cut -d. -f1)
if (( NPM_MAJOR < 8 )); then
  echo "Требуется npm ≥ 8, у вас $(npm -v)"; exit 1
fi

# Очистка зависимостей при --clean
if [ "$CLEAN" = true ]; then
  echo "Удаляем старые зависимости..."
  rm -rf node_modules package-lock.json
fi

# Установка зависимостей
echo "Устанавливаем зависимости..."
npm install

# Сборка проекта
echo "Собираем проект..."
npm run build

# Запуск dev-сервера при --start
if [ "$START" = true ]; then
  echo "Запускаем dev-сервер..."
  # Используем локальный ng через npx, чтобы не требовать глобальной установки @angular/cli
  npx ng serve --open
fi

echo "Готово! 🎉"
