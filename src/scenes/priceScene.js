import { Scenes } from 'telegraf';
import { getSberRates } from '../parser.js';
import { CATEGORIES, MARKUPS, calculatePrice } from '../utils/formulas.js';
import { getTaobaoRate } from './adjustScene.js';

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
          [{ text: 'CNY', callback_data: 'cny' }],
          [{ text: 'US/CN (Taobao)', callback_data: 'taobao' }]
        ]
      }
    });
    return ctx.wizard.next();
  },

  // Шаг 3: Выбор категории
  async (ctx) => {
    const currency = ctx.callbackQuery?.data;
    if (!['usd', 'cny', 'taobao'].includes(currency)) return;

    ctx.wizard.state.currency = currency;

    const keyboard = Object.entries(CATEGORIES).map(([key, name]) => [{
      text: name, callback_data: key
    }]);

    const symbol = currency === 'usd' ? '$' : '¥';
    const label = currency === 'taobao' ? '¥ (Taobao)' : symbol;

    await ctx.editMessageText(
      `Стоимость: *${ctx.wizard.state.amount} ${label}*\nВыберите категорию:`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
    );
    return ctx.wizard.next();
  },

  // Шаг 4: Расчёт с защитой от таймаута
  async (ctx) => {
    const category = ctx.callbackQuery?.data;
    if (!CATEGORIES[category]) return;

    const { amount, currency } = ctx.wizard.state;

    try {
      // Добавляем таймаут на получение курсов (15 секунд)
      const ratesPromise = getSberRates();
      const sberRates = await Promise.race([
        ratesPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
      ]);

      const taobaoRate = getTaobaoRate();

      let costRub = 0;
      let path = '';
      let usedRate = 0;
      let commissionRub = 0;
      let amountUSD = 0;

      if (currency === 'usd') {
        usedRate = sberRates.usd || 0;
        commissionRub = amount * 2;
        costRub = amount * (usedRate + 2);
        path = `USD → RUB (Сбер +2 ₽)`;

      } else if (currency === 'cny') {
        usedRate = sberRates.cny || 0;
        commissionRub = amount * 1.5;
        costRub = amount * (usedRate + 1.5);
        path = `CNY → RUB (Сбер +1.5 ₽)`;

      } else if (currency === 'taobao') {
        if (!taobaoRate || taobaoRate === 0) {
          await ctx.reply('Курс Taobao не задан! Сначала используйте /adjust');
          return ctx.scene.leave();
        }
        if (!sberRates.usd) {
          await ctx.reply('Курс USD недоступен. Попробуйте позже.');
          return ctx.scene.leave();
        }

        amountUSD = amount / taobaoRate;
        const usdWithFee = sberRates.usd + 2;
        const baseCost = amountUSD * usdWithFee;
        const taobaoFee = baseCost * 0.035;

        costRub = baseCost + taobaoFee;
        commissionRub = amountUSD * 2 + taobaoFee;
        path = `US/CN (Taobao: ${taobaoRate.toFixed(4)}) → RUB (Сбер +2 ₽ +3.5%)`;
        usedRate = usdWithFee;
      }

      if (costRub === 0) {
        await ctx.reply('Не удалось рассчитать. Попробуйте позже.');
        return ctx.scene.leave();
      }

      const commissionPercent = costRub > 0 ? (commissionRub / (costRub - commissionRub)) * 100 : 0;
      const finalPrice = calculatePrice(costRub, category);
      const markupPercent = ((MARKUPS[category] - 1) * 100).toFixed(0);

      await ctx.editMessageText(
        `*Результат*\n\n` +
        `Ввод: \`${amount} ${currency === 'usd' ? '$' : '¥'}\`\n` +
        `Конвертация: *${path}*\n` +
        (currency === 'taobao' ? `Конвертация в USD: \`${amountUSD.toFixed(2)} $\`\n` : '') +
        `Себестоимость: \`${costRub.toFixed(2)} ₽\`\n` +
        `КУРС: \`${usedRate.toFixed(2)} ₽\`\n` +
        `Категория: *${CATEGORIES[category]}*\n` +
        `Комиссия: *+${commissionPercent.toFixed(1)}%* (\`${commissionRub.toFixed(2)} ₽\`)\n\n` +
        `Наценка: *+${markupPercent}%*\n\n` +
        `Цена для покупателя: *${Math.ceil(finalPrice)} ₽*`,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      console.error('Ошибка при расчёте:', error.message);
      await ctx.reply('Извините, произошла ошибка при получении курсов. Давайте попробуем снова.');
      await ctx.reply('Введите /calc, чтобы начать заново.');
    }

    return ctx.scene.leave();
  }
);

export default priceWizard;