# BentoBao

## Overview
BentoBao - это Telegram бот для расчёта цены товаров с учётом курса валют и наценки по категориям.

## Project Structure
```
src/
├── App.tsx              # Main React component
├── main.tsx             # React entry point
├── bot.js               # Telegram bot setup and commands
├── index.js             # Bot entry point
├── parser.js            # Exchange rate parser (Sberbank)
├── scenes/
│   └── priceScene.js    # Telegram bot price calculation wizard
└── utils/
    └── formulas.js      # Price calculation and markup formulas
```

## Technologies
- **Frontend**: React 19, TypeScript, Vite 7
- **Backend**: Node.js with Telegraf (Telegram Bot API)
- **Scraping**: Axios, Cheerio, Playwright, Puppeteer
- **Package Manager**: npm

## Configuration
- **Bot**: Запускается через `npm start` (выполняет src/index.js)
- **Environment**: BOT_TOKEN хранится в Replit Secrets
- **Workflow**: Настроен автоматический запуск бота при старте проекта

## Features
The Telegram bot provides:
- `/calc` - Multi-step price calculation wizard
- `/rates` - Current USD/CNY exchange rates from Sberbank
- `/convert [amount]` - Convert RUB to USD/CNY

Price calculations support categories:
- Cosplay (+50%)
- Cosmetics (+40%)
- K-pop (+35%)
- Tech (+60%)
- Discount (+25%)

## Recent Changes (2025-11-05)
- Исправлены пути импортов в bot.js, index.js и priceScene.js
- Добавлен импорт MARKUPS в priceScene.js
- Удалён frontend workflow, настроен bot workflow
- Создан .env.example для примера
- Обновлён .gitignore для исключения секретных файлов
- BOT_TOKEN настроен через Replit Secrets
- Бот успешно запущен и работает

## Использование

### Запуск
Бот настроен на автоматический запуск при открытии проекта в Replit.
Вручную запустить можно командой: `npm start`

### Команды бота
- `/start` - Приветствие
- `/calc` - Мастер расчёта цены (пошаговый процесс)
- `/rates` - Текущие курсы USD и CNY от Сбербанка
- `/convert [сумма]` - Конвертация рублей в USD/CNY

### Настройка BOT_TOKEN
1. Найдите @BotFather в Telegram
2. Создайте бота командой /newbot
3. Скопируйте токен
4. Добавьте BOT_TOKEN в Replit Secrets (уже настроено)

## Технические детали
- Курсы валют парсятся с сайта valuta24.ru (раздел Сбербанк)
- Кэширование курсов: 5 минут
- Все взаимодействия на русском языке
- Используется Telegraf для работы с Telegram Bot API
