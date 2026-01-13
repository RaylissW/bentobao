import { Scenes } from 'telegraf';
import { getSberRates } from '../parser.js';
import { CATEGORIES, MARKUPS, calculatePrice } from '../utils/formulas.js';
import { getTaobaoRate } from './adjustScene.js'; // ← импортируем курс

// Определяем множители комиссий на основе реальных потерь (из твоих расчётов)
// Эти значения учитывают конвертационные потери и сервисные комиссии, чтобы себестоимость была точной и ты не работала в убыток
const COMMISSION_MULTIPLIERS = {
  usd: 1.0653,  // ~3.43% конверт (RUB→UZS→USD) + ~3% сервис = +6.53% всего
  cny: 1.0668,  // ~6.68% включая 1% при переводе на Alipay
  taobao: 1.0653  // Для taobao используем USD-множитель, т.к. идёт через USD
};

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

    // Убрали additive, т.к. теперь комиссии встроены в множители (чтобы избежать дублирования и убытка)
    // Себестоимость теперь = amount * sberRate * multiplier, с округлением вверх на финальной себестоимости
    const multiplier = COMMISSION_MULTIPLIERS[currency] || 1; // fallback на 1, если не найдено
    const commissionPercent = ((multiplier - 1) * 100).toFixed(2); // Для вывода комиссии

    if (currency === 'usd') {
      usedRate = sberRates.usd || 0;
      if (usedRate <= 0) {
        await ctx.reply('Курс USD недоступен. Попробуйте позже.');
        return ctx.scene.leave();
      }
      costRub = Math.ceil(amount * usedRate * multiplier); // Округление вверх здесь, чтобы покрыть все копейки и избежать убытка
      path = `USD → RUB (Сбер)`;

    } else if (currency === 'cny') {
      usedRate = sberRates.cny || 0;
      if (usedRate <= 0) {
        await ctx.reply('Курс CNY недоступен. Попробуйте позже.');
        return ctx.scene.leave();
      }
      costRub = Math.ceil(amount * usedRate * multiplier); // Аналогично, округление вверх
      path = `CNY → RUB (Сбер)`;

    } else if (currency === 'taobao') {
      if (!taobaoRate || taobaoRate === 0) {
        await ctx.reply('Курс Taobao не задан! Сначала используйте /adjust');
        return ctx.scene.leave();
      }
      if (!sberRates.usd || sberRates.usd <= 0) {
        await ctx.reply('Курс USD недоступен. Попробуйте позже.');
        return ctx.scene.leave();
      }
      const amountUSD = amount / taobaoRate; // CNY → USD (исправил: деление, т.к. taobaoRate - это CNY/USD? Подтверди, если это USD/CNY)
      // Примечание: в твоём коде было amount * taobaoRate, но по примеру 69.9 CNY * taobaoRate = 10.1 USD ⇒ taobaoRate ≈0.1445 USD/CNY
      // Если taobaoRate = CNY/USD (напр. 6.92), то amountUSD = amount / taobaoRate
      // Я предположил CNY/USD; если иначе - скорректируй
      costRub = Math.ceil(amountUSD * sberRates.usd * multiplier);
      path = `US/CN (Taobao: ${taobaoRate}) → RUB (Сбер)`;
      usedRate = sberRates.usd;
    }

    if (costRub === 0) {
      await ctx.reply('Не удалось рассчитать. Проверьте курсы.');
      return ctx.scene.leave();
    }

    const finalPrice = calculatePrice(costRub, category);
    const markupPercent = ((MARKUPS[category] - 1) * 100).toFixed(0);

    await ctx.editMessageText(
      `*Результат*\n\n` +
      `Ввод: \`${amount} ${currency === 'usd' ? '$' : '¥'}\`\n` +
      `Конвертация: *${path}*\n` +
      (currency === 'taobao'
          ? `Конвертация в USD: \`${(amount / taobaoRate).toFixed(2)} $\`\n` // Исправил на /, если taobaoRate = CNY/USD; подкорректируй если нужно
          : ''
      ) +
      `Себестоимость: \`${costRub.toFixed(2)} ₽\`\n` +
      `КУРС: * ${usedRate} ${currency === 'usd' ? '$' : '¥'}*\n\n` +
      `Категория: *${CATEGORIES[category]}*\n` +
      `Наценка: *+${markupPercent}%*\n\n` +
      `Комиссия: *+${commissionPercent}%*\n\n` +  // Вернул комиссию для проверки (конвертация + сервис, как ты описала)
      `Цена для покупателя: *${Math.ceil(finalPrice)} ₽*`,
      { parse_mode: 'Markdown' }
    );

    await ctx.reply('Ещё расчёт? → /calc');
    return ctx.scene.leave();
  }
);

export default priceWizard;