import { Scenes } from 'telegraf';
import { getSberRates } from '../parser.js';
import { CATEGORIES, MARKUPS, calculatePrice } from '../utils/formulas.js';
import { getTaobaoRate } from './adjustScene.js'; // ← импортируем курс

const priceWizard = new Scenes.WizardScene(
  'PRICE_WIZARD',

  // Шаг 1: Ввод стоимости
  async (ctx) => {
    await ctx.reply('Здравствуйте! Введите стоимость товара (USD, CNY):');
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
          [{ text: 'US/CN', callback_data: 'taobao' }]
        ]
      }
    });
    return ctx.wizard.next();
  },

  // Шаг 3: Выбор валюты → категория
  async (ctx) => {
    const currency = ctx.callbackQuery?.data;
    if (!['usd', 'cny', 'taobao'].includes(currency)) return;

    ctx.wizard.state.currency = currency;

    const keyboard = Object.entries(CATEGORIES).map(([key, name]) => [{
      text: name, callback_data: key
    }]);

    const symbol = currency === 'usd' ? '$' : '¥';
    const label = currency === 'taobao' ? '¥ (расч)' : symbol;

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
    const sberRates = await getSberRates();
    const taobaoRate = getTaobaoRate();

    let costRub = 0;
    let path = '';
    let usedRate = 0;

    if (currency === 'usd') {
      // Прямой: USD → RUB
      usedRate = (sberRates.usd + 1.5) || 0;
      costRub = amount * usedRate;
      path = `USD → RUB (Сбер)`;

    } else if (currency === 'cny') {
      // Прямой: CNY → RUB
      usedRate = (sberRates.cny + 1.5) || 0;
      costRub = amount * usedRate;
      path = `CNY → RUB (Сбер)`;

    } else if (currency === 'taobao') {
      // Через Taobao: CNY → USD (по Taobao) → RUB (по Сберу)
      if (!taobaoRate || taobaoRate === 0) {
        await ctx.reply('Курс Taobao не задан! Сначала используйте /adjust');
        return ctx.scene.leave();
      }
      if (!sberRates.usd) {
        await ctx.reply('Курс USD недоступен. Попробуйте позже.');
        return ctx.scene.leave();
      }

      const amountUSD = amount * taobaoRate; // CNY → USD
      costRub = amountUSD  * (sberRates.usd + 1.5);
      path = `US/CN (Taobao: ${taobaoRate}) → RUB (Сбер)`;
      usedRate = sberRates.usd;
    }

    if (costRub === 0) {
      await ctx.reply('Не удалось рассчитать. Проверьте курсы.');
      return ctx.scene.leave();
    }

    const finalPrice = calculatePrice(costRub, category, currency);
    const markupPercent = ((MARKUPS[category] - 1) * 100).toFixed(0);

    await ctx.editMessageText(
      `*Результат*\n\n` +
      `Ввод: \`${amount} ${currency === 'usd' ? '$' : '¥'}\`\n` +
      `Конвертация: *${path}*\n` +
      (currency === 'taobao'
          ? `Конвертация в USD: \`${(amount * taobaoRate).toFixed(2)} $\`\n`
          : ''
      ) +
      `Себестоимость: \`${costRub.toFixed(2)} ₽\`\n` +
      `Категория: *${CATEGORIES[category]}*\n` +
      `Наценка: *+${markupPercent}%*\n\n` +
      `Цена для покупателя: *${finalPrice.toFixed(2)} ₽*`,
      { parse_mode: 'Markdown' }
    );

    await ctx.reply('Ещё расчёт? → /calc');
    return ctx.scene.leave();
  }
);

export default priceWizard;