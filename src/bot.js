

import { Telegraf, Scenes, session } from 'telegraf';
import { getSberRates } from './parser.js';
import priceWizard from './scenes/priceScene.js';
import priceAdjustment, { getTaobaoRate } from './scenes/adjustScene.js';

const stage = new Scenes.Stage([priceWizard, priceAdjustment]);

export function createBot(token) {
  const bot = new Telegraf(token);

  bot.use(session());
  bot.use(stage.middleware());

  bot.start((ctx) => {
    ctx.replyWithMarkdown(`
    *Привет! Я бот для расчёта цен*

    *Доступные команды:*

    /calc — рассчитать цену товара для покупателя
    /adjust — задать курс USD через Taobao
    /rates — курсы Сбербанка 

    _Начните с /calc или /adjust_
    `.trim());
  });

  bot.command('calc', (ctx) => ctx.scene.enter('PRICE_WIZARD'));
  bot.command('adjust', (ctx) => ctx.scene.enter('PRICE_ADJUSTMENT'));

  bot.command('rates', async (ctx) => {
    const rates = await getSberRates();
    const taobao = getTaobaoRate();
    const time = new Date().toLocaleTimeString('ru-RU', {
      timeZone: 'Asia/Yekaterinburg',  // +5 от UTC
      hour: '2-digit',
      minute: '2-digit'
    });

    const usd = rates.usd || 0;
    const cny = rates.cny || 0;

    ctx.replyWithMarkdown(`
*Курсы валют*

*Сбербанк (покупка):*
• *USD*: \`${usd} ₽\`
• *CNY*: \`${cny} ₽\`

*Taobao (US/CN)*: \`${taobao || 'не задан'}\`

_Обновлено: ${time}_
    `.trim());

  })

  bot.command('convert', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2 || isNaN(args[1])) {
      return ctx.reply('Использование: /convert 5000');
    }

    const amount = parseFloat(args[1]);
    if (amount <= 0) return ctx.reply('Сумма > 0');

    const rates = await getSberRates();
    if (!rates.usd || !rates.cny) {
      return ctx.reply('Курсы недоступны');
    }

    const usd = (amount / rates.usd).toFixed(2);
    const cny = (amount / rates.cny).toFixed(2);

    ctx.replyWithMarkdown(`
*${amount.toLocaleString()} RUB →*

*USD*: \`${usd}\`
*CNY*: \`${cny}\`
    `.trim());
  });

  bot.on('text', (ctx) => {
    ctx.replyWithMarkdown(`
*Команды:*

/calc — цена товара
/adjust — курс Taobao
/rates — все курсы

    `.trim());
  });

  return bot;
}

/*
 if (!rates.usd || !rates.cny) {
      await ctx.reply('Хотите ввести курс самостоятельно?', {
        reply_markup: {
          inline_keyboard: [
            [{text: '🇺🇸 Доллар (USD)', callback_data: 'manual_usd'}],
            [{text: '🇨🇳 Юань (CNY)', callback_data: 'manual_cny'}],
            [{text: '❌ Отмена', callback_data: 'manual_cancel'}]
          ]
        }
      });
      return;
    }
 */