// scenes/addProductScene.js
import { Scenes } from 'telegraf';
import { addClientIfNotExists, addProduct } from '../services/sheetsService.js';
import { getSberRates } from '../parser.js';
import { getTaobaoRate } from './adjustScene.js';

const addProductScene = new Scenes.WizardScene(
  'ADD_PRODUCT',

  // 1. Поставка
  async (ctx) => {
    await ctx.reply('Введите номер поставки (число):');
    return ctx.wizard.next();
  },

  // 2. Клиент
  async (ctx) => {
    const поставка = ctx.message.text.trim();
    if (!/^\d+$/.test(поставка)) {
      await ctx.reply('Неверный номер. Только цифры.');
      return;
    }
    ctx.wizard.state.поставка = поставка;

    await ctx.reply('Введите ID клиента, юзернейм (@user) или имя:');
    return ctx.wizard.next();
  },

  // 3. Товар
  async (ctx) => {
    ctx.wizard.state.клиентВвод = ctx.message.text.trim();
    await ctx.reply('Введите название товара:');
    return ctx.wizard.next();
  },

  // 4. Кол-во
  async (ctx) => {
    ctx.wizard.state.товар = ctx.message.text.trim();
    await ctx.reply('Введите количество:');
    return ctx.wizard.next();
  },

  // 5. Характеристики
  async (ctx) => {
    const колво = parseInt(ctx.message.text);
    if (isNaN(колво) || колво <= 0) {
      await ctx.reply('Количество — число > 0');
      return;
    }
    ctx.wizard.state.колво = колво;

    await ctx.reply('Введите характеристики (цвет, размер и т.д.):');
    return ctx.wizard.next();
  },

  // 6. Ссылка
  async (ctx) => {
    ctx.wizard.state.хар = ctx.message.text.trim();
    await ctx.reply('Введите ссылку на товар:');
    return ctx.wizard.next();
  },

  // 7. Валюта
  async (ctx) => {
    const ссылка = ctx.message.text.trim();
    if (!ссылка.startsWith('http')) {
      await ctx.reply('Ссылка должна начинаться с http/https');
      return;
    }
    ctx.wizard.state.ссылка = ссылка;

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

  // 8. Стоимость + категория
  async (ctx) => {
    const currency = ctx.callbackQuery?.data;
    if (!['usd', 'cny'].includes(currency)) return;

    ctx.wizard.state.currency = currency;
    const symbol = currency === 'usd' ? '$' : '¥';

    await ctx.editMessageText(`Введите стоимость в ${symbol}:`, {
      reply_markup: { inline_keyboard: [] }
    });
    return ctx.wizard.next();
  },

  // 9. Категория
  async (ctx) => {
    const cost = parseFloat(ctx.message.text.replace(',', '.'));
    if (isNaN(cost) || cost <= 0) {
      await ctx.reply('Введите число');
      return;
    }
    ctx.wizard.state.cost = cost;

    const keyboard = Object.entries(CATEGORIES).map(([k, v]) => [{ text: v, callback_data: k }]);
    await ctx.reply('Выберите категорию:', { reply_markup: { inline_keyboard: keyboard } });
    return ctx.wizard.next();
  },

  // 10. Финал
  async (ctx) => {
    const category = ctx.callbackQuery?.data;
    if (!CATEGORIES[category]) return;

    const state = ctx.wizard.state;
    const rates = await getSberRates();
    const taobaoRate = getTaobaoRate();

    // Добавляем клиента, если нет
    const clientId = await addClientIfNotExists(state.клиентВвод);

    // Добавляем товар
    const result = await addProduct({
      поставка: state.поставка,
      clientId,
      товар: state.товар,
      колво: state.колво,
      хар: state.хар,
      ссылка: state.ссылка,
      currency: state.currency,
      cost: state.cost,
      category,
      rates,
      taobaoRate
    });

    if (result.success) {
      await ctx.reply(`Товар добавлен!\nID: ${result.row}`);
    } else {
      await ctx.reply(`Ошибка: ${result.error}`);
    }

    await ctx.reply('Ещё товар? → /addproduct');
    return ctx.scene.leave();
  }
);

export default addProductScene;