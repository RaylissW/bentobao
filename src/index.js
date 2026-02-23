import 'dotenv/config';
import { createBot } from './bot.js';

const bot = createBot("7987270087:AAEiHlwUdZhg59zKL45cezAgdMNIA410EYc");

bot.launch()
  .then(() => console.log('Бот запущен!'))
  .catch(err => console.error('Ошибка:', err));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));