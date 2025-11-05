# BentoBao

## Overview
BentoBao is a hybrid application with two components:
1. **React Frontend** - A web interface built with React, TypeScript, and Vite
2. **Telegram Bot** - A price calculation bot for currency conversion and markup calculations

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
- **Frontend**: Runs on port 5000 (0.0.0.0) for Replit webview
- **Vite Config**: Configured for Replit environment with HMR on port 5000
- **Environment**: Bot token stored in `.env` file

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
- Fixed import paths in bot.js, index.js, and priceScene.js
- Added MARKUPS import to priceScene.js
- Configured Vite for Replit (0.0.0.0:5000, HMR)
- Created .env file for bot token
- Updated .gitignore to exclude .env files
- Set up frontend workflow on port 5000

## Development
- Frontend: `npm run dev` (runs on port 5000)
- Bot: `npm start` (runs src/index.js)
- Build: `npm run build`
- Lint: `npm run lint`

## Notes
- The frontend and bot are separate components
- Bot token should be configured in .env file
- Exchange rates are cached for 5 minutes
- The bot uses Russian language for all interactions
