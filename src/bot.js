// src/bot/bot.js
import { Telegraf, Scenes, session } from 'telegraf';
import { getSberRates } from '../parser.js';
import priceWizard from './scenes/priceScene.js';

const stage = new Scenes.Stage([priceWizard]);

export function createBot(token) {
  const bot = new Telegraf(token);

  bot.use(session());
  bot.use(stage.middleware());

  // === Команды ===
  bot.start((ctx) => ctx.reply('Привет! Используйте /calc для расчёта цены.'));

  bot.command('calc', (ctx) => ctx.scene.enter('PRICE_WIZARD'));

  bot.command('rates', async (ctx) => {
    const rates = await getSberRates();
    const time = new Date().toLocaleTimeString('ru-RU');
    const usd = rates.usd || 0;
    const cny = rates.cny || 0;

    ctx.replyWithMarkdownV2(`
*Курсы Сбербанка*

*USD*: \`${usd} ₽\`
*CNY*: \`${cny} ₽\`

_Обновлено: ${time}_
    `.trim());
  });

  bot.command('convert', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2 || isNaN(args[1])) {
      return ctx.reply('Использование: /convert 5000');
    }

    const amount = parseFloat(args[1]);
    if (amount <= 0) return ctx.reply('Сумма > 0');

    const rates = await getSberRates();
    if (!rates.usd || !rates.cny) return ctx.reply('Курсы недоступны');

    const usd = (amount / rates.usd).toFixed(2);
    const cny = (amount / rates.cny).toFixed(2);

    ctx.replyWithMarkdownV2(`
*${amount} RUB →*

*USD*: \`${usd}\`
*CNY*: \`${cny}\`
    `.trim());
  });

  // Любой текст → помощь
  bot.on('text', (ctx) => {
    ctx.replyWithMarkdownV2(`
*Команды:*

/calc — рассчитать цену
/rates — курсы
/convert 5000 — конвертация
    `.trim());
  });

  return bot;
}