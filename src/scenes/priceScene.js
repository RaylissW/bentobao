// src/bot/scenes/priceScene.js
import { Scenes } from 'telegraf';
import { getSberRates } from '../../parser.js';
import { CATEGORIES, calculatePrice } from '../utils/formulas.js';

const priceWizard = new Scenes.WizardScene(
  'PRICE_WIZARD',
  // Шаг 1: Ввод стоимости
  async (ctx) => {
    await ctx.reply('Здравствуйте! Введите стоимость товара (в USD или CNY):');
    return ctx.wizard.next();
  },

  // Шаг 2: Проверка суммы
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    const amount = parseFloat(text?.replace(',', '.'));

    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('Введите корректную сумму, например: 15.99');
      return;
    }

    ctx.wizard.state.amount = amount;

    await ctx.reply('Выберите валюту:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'USD', callback_data: 'usd' }],
          [{ text: 'CNY', callback_data: 'cny' }]
        ]
      }
    });
    return ctx.wizard.next();
  },

  // Шаг 3: Выбор валюты → категория
  async (ctx) => {
    const currency = ctx.callbackQuery?.data;
    if (!['usd', 'cny'].includes(currency)) return;

    ctx.wizard.state.currency = currency;

    const keyboard = Object.entries(CATEGORIES).map(([key, name]) => [{
      text: name, callback_data: key
    }]);

    await ctx.editMessageText(
      `Стоимость: *${ctx.wizard.state.amount} ${currency === 'usd' ? '$' : '¥'}*\nВыберите категорию:`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
    );
    return ctx.wizard.next();
  },

  // Шаг 4: Расчёт
  async (ctx) => {
    const category = ctx.callbackQuery?.data;
    if (!CATEGORIES[category]) return;

    const { amount, currency } = ctx.wizard.state;
    const rates = await getSberRates();
    const rate = currency === 'usd' ? rates.usd : rates.cny;

    if (!rate) {
      await ctx.reply('Курсы недоступны. Попробуйте позже.');
      return ctx.scene.leave();
    }

    const costRub = amount * rate;
    const finalPrice = calculatePrice(costRub, category);

    const symbol = currency === 'usd' ? '$' : '¥';
    const markupPercent = ((MARKUPS[category] - 1) * 100).toFixed(0);

    await ctx.editMessageText(
      `*Результат*\n\n` +
      `Стоимость: \`${amount} ${symbol}\`\n` +
      `Курс: \`${rate} ₽\`\n` +
      `Себестоимость: \`${costRub.toFixed(2)} ₽\`\n` +
      `Категория: *${CATEGORIES[category]}*\n` +
      `Наценка: *+${markupPercent}%*\n\n` +
      `Цена для покупателя: *${finalPrice.toFixed(2)} ₽*`,
      { parse_mode: 'Markdown' }
    );

    await ctx.reply('Хотите рассчитать ещё? Нажмите /calc');
    return ctx.scene.leave();
  }
);

export default priceWizard;