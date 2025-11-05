import 'dotenv/config';
import { createBot } from './bot/bot.js';

const bot = createBot(process.env.BOT_TOKEN);

bot.launch()
  .then(() => console.log('Бот запущен!'))
  .catch(err => console.error('Ошибка:', err));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));