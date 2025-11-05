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
- **Environment**: Bot token should be stored using Replit Secrets (BOT_TOKEN) or in a local `.env` file (not committed to git)

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
- Created .env.example template for environment variables
- Updated .gitignore to exclude .env files and env.js
- Set up frontend workflow on port 5000
- Configured deployment settings for autoscale with Vite preview
- Removed exposed bot token and created secure setup instructions

## Development
- Frontend: `npm run dev` (runs on port 5000)
- Bot: `npm start` (runs src/index.js)
- Build: `npm run build`
- Lint: `npm run lint`

## Setup Instructions

### Frontend
1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
3. Access at http://localhost:5000

### Telegram Bot
1. Create a `.env` file based on `.env.example`
2. Add your Telegram bot token: `BOT_TOKEN=your_token_here`
3. Or use Replit Secrets to store BOT_TOKEN
4. Run the bot: `npm start`

## Deployment
The project is configured for Replit autoscale deployment:
- Build: `npm run build`
- Run: `npx vite preview --host 0.0.0.0 --port 5000`

For the Telegram bot in production, you'll need to set up a separate deployment process or run it as a background service.

## Notes
- The frontend and bot are separate components
- Bot token must be kept secure - use Replit Secrets or a local .env file (never commit to git)
- Exchange rates are cached for 5 minutes
- The bot uses Russian language for all interactions
- Frontend deployment uses Vite preview mode for production serving
