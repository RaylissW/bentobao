// scenes/addClientScene.js
import { Scenes } from 'telegraf';
import { addClientIfNotExists } from '../services/sheetsService.js';

const addClientScene = new Scenes.WizardScene(
  'ADD_CLIENT',

  // Шаг 1: Ввод юзернейма или имени
  async (ctx) => {
    await ctx.reply('Введите юзернейм (@username) или имя клиента:');
    return ctx.wizard.next();
  },

  // Шаг 2: Добавление
  async (ctx) => {
    const input = ctx.message.text.trim();
    if (!input) {
      await ctx.reply('Пустой ввод. Попробуйте снова.');
      return;
    }

    try {
      const clientId = await addClientIfNotExists(input);

      await ctx.reply(`
Клиент добавлен или найден!

**ID:** \`${clientId}\`
**ЮЗ:** ${input.startsWith('@') ? input : ''}
**Ник:** ${!input.startsWith('@') ? input : ''}
      `.trim(), { parse_mode: 'Markdown' });

      await ctx.reply('Добавить ещё? → /addclient');
    } catch (err) {
      await ctx.reply(`Ошибка: ${err.message}`);
    }

    return ctx.scene.leave();
  }
);

export default addClientScene;