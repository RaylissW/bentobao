
import { Scenes } from 'telegraf';
import { getSberRates } from '../parser.js';
import { CATEGORIES, MARKUPS, calculatePrice } from '../utils/formulas.js';
import { getTaobaoRate } from './adjustScene.js';

const priceWizard = new Scenes.WizardScene(
  'PRICE_WIZARD',

  // Шаг 1: Ввод
  async (ctx) => {
    await ctx.reply('Введите стоимость товара (USD, CNY):');
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
          [{ text: 'CNY', callback_data: 'cny' }],
          [{ text: 'CNY → Taobao → USD', callback_data: 'taobao' }]
        ]
      }
    });
    return ctx.wizard.next();
  },

  // Шаг 3: Категория
  async (ctx) => {
    const currency = ctx.callbackQuery?.data;
    if (!['usd', 'cny', 'taobao'].includes(currency)) return;

    ctx.wizard.state.currency = currency;

    const keyboard = Object.entries(CATEGORIES).map(([key, name]) => [{
      text: name, callback_data: key
    }]);

    const label = currency === 'taobao' ? '¥ (Taobao)' : (currency === 'usd' ? '$' : '¥');

    await ctx.editMessageText(
      `Стоимость: *${ctx.wizard.state.amount} ${label}*\nВыберите категорию:`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
    );
    return ctx.wizard.next();
  },

  // Шаг 4: Расчёт
  async (ctx) => {
    const category = ctx.callbackQuery?.data;
    if (!CATEGORIES[category]) return;

    const { amount, currency } = ctx.wizard.state;
    const sber = await getSberRates();
    const taobaoRate = getTaobaoRate();

    let costRub = 0;
    let path = '';
    let usdAmount = 0;
    let commissionPercent = 0;

    if (currency === 'usd') {
      usdAmount = amount;
      costRub = amount * (sber.usd + 2); // +2 ₽ к курсу
      commissionPercent = ((2 / sber.usd) * 100).toFixed(1);
      path = `USD → RUB (Сбер + 2 ₽)`;

    } else if (currency === 'cny') {
      usdAmount = amount / sber.cny * sber.usd;
      costRub = amount * (sber.cny + 1.5); // +1.5 ₽ к юаню
      commissionPercent = ((1.5 / sber.cny) * 100).toFixed(1);
      path = `CNY → RUB (Сбер + 1.5 ₽)`;

    } else if (currency === 'taobao') {
      if (!taobaoRate) {
        await ctx.reply('Курс Taobao не задан! Используйте /adjust');
        return ctx.scene.leave();
      }
      usdAmount = amount / taobaoRate; // CNY → USD
      costRub = usdAmount * (sber.usd + 1.5);
      commissionPercent = ((1.5 / sber.usd) * 100).toFixed(1);
      path = `CNY → USD (Taobao: ${taobaoRate}) → RUB (+1.5 ₽)`;
    }

    if (!costRub) {
      await ctx.reply('Курсы недоступны.');
      return ctx.scene.leave();
    }

    const finalPrice = calculatePrice(costRub, category);
    const markupPercent = ((MARKUPS[category] - 1) * 100).toFixed(0);

    await ctx.editMessageText(
      `*Результат*\n\n` +
      `Ввод: \`${amount} ${currency === 'usd' ? '$' : '¥'}\`\n` +
      `Путь: *${path}*\n` +
      (currency === 'taobao'
          ? `├ USD: \`${usdAmount.toFixed(2)} $\`\n`
          : ''
      ) +
      `├ Себестоимость: \`${costRub.toFixed(2)} ₽\`\n` +
      `├ Комиссия: *+${commissionPercent}%*\n` +
      `├ Категория: *${CATEGORIES[category]}*\n` +
      `└ Наценка: *+${markupPercent}%*\n\n` +
      `*Итого: ${finalPrice.toFixed(2)} ₽*`,
      { parse_mode: 'Markdown' }
    );

    await ctx.reply('Ещё? → /calc');
    return ctx.scene.leave();
  }
);

export default priceWizard;