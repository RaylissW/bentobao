// src/scenes/adjustScene.js
import { Scenes } from 'telegraf';

// Глобальное хранилище курса (в памяти)
let taobaoRate = 0; // USD / CNY (например, 7.2)

const priceAdjustment = new Scenes.WizardScene(
  'PRICE_ADJUSTMENT',

  // Шаг 1: Ввод CNY
  async (ctx) => {
    await ctx.reply('Введите стоимость товара в юанях (CNY):');
    return ctx.wizard.next();
  },

  // Шаг 2: Проверка CNY
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    const amountCNY = parseFloat(text?.replace(',', '.'));
    if (isNaN(amountCNY) || amountCNY <= 0) {
      await ctx.reply('Введите корректную сумму, например: 15.99');
      return;
    }
    ctx.wizard.state.amountCNY = amountCNY;
    await ctx.reply('Теперь введите стоимость этого же товара в долларах (USD):');
    return ctx.wizard.next();
  },

  // Шаг 3: Проверка USD
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    const amountUSD = parseFloat(text?.replace(',', '.'));
    if (isNaN(amountUSD) || amountUSD <= 0) {
      await ctx.reply('Введите корректную сумму, например: 15.99');
      return;
    }

    const amountCNY = ctx.wizard.state.amountCNY;
    const rate = amountUSD / amountCNY; // Например: 10 USD / 1.39 CNY = 7.19

    taobaoRate = parseFloat(rate.toFixed(4)); // Сохраняем

    await ctx.replyWithMarkdown(`
*Курс на Taobao сохранён!*

*US/CN* = \`${taobaoRate}\`

_Теперь можно использовать в расчётах._
    `);

    await ctx.reply('Хотите рассчитать цену? → /calc');
    return ctx.scene.leave();
  }
);

// Экспорт + геттер
export default priceAdjustment;
export const getTaobaoRate = () => taobaoRate;