const { Telegraf, Markup } = require('telegraf');
const moment = require('moment');
const express = require('express');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || 'https://tg-list-bot.herokuapp.com/';

const app = express();
const bot = new Telegraf(BOT_TOKEN);
const list = new Map();
let date = null;

bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));

function getNextWednesday() {
  return moment().weekday(3).format('DD.MM');
}

function renderList() {
  if (!date) {
    date = getNextWednesday();
  }
  let sting = `⚽️ ${date} ⚽️\n\n`;
  let iterator = 1;
  list.forEach((value) => {
    sting += `${iterator}. ${value.name} ${value?.plusOne ? '(+1)' : ''}${value?.maybe ? '(50/50)' : ''}\n`;
    iterator += 1;
  });
  return list.size ? sting : 'Никого😔';
}

const yesNoKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('Да', 'yes'),
  Markup.button.callback('Нет', 'no'),
]);

const removeKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('Да', 'remove'),
  Markup.button.callback('Нет', 'notRemove'),
]);

const quantityKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('Один', 'once'),
  Markup.button.callback('+1', 'plusOne'),
  Markup.button.callback('50/50', 'maybe'),
]);

bot.help((ctx) => ctx.reply('Commands:\n\n/help - информация о командах\n/list - показать список\n/clear_list - очистить весь список\n/add - добавить себя в список\n/remove_me - удалить себя из списка'));

bot.command('list', (ctx) => ctx.reply(renderList()));
bot.command('clear_list', (ctx) => {
  list.clear();
  date = null;
  ctx.reply('Список очищен⚽️');
});

bot.command('add', (ctx) => {
  ctx.telegram.sendMessage(
    ctx.chat.id,
    'Играеш?', yesNoKeyboard,
  );
});

bot.command('remove_me', (ctx) => ctx.telegram.sendMessage(
  ctx.chat.id,
  'Удалить тебя из списка?', removeKeyboard,
));

bot.action('remove', (ctx) => {
  list.delete(ctx.from.id);
  ctx.editMessageText(renderList());
});
bot.action('notRemove', (ctx) => {
  ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id);
});

bot.action('no', (ctx) => ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id));

bot.action('yes', (ctx) => {
  ctx.telegram.sendMessage(
    ctx.chat.id,
    'Будешь?',
    quantityKeyboard,
  );
  ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id);
});

bot.action('once', (ctx) => {
  list.set(
    ctx.from.id,
    {
      id: ctx.from.id,
      name: `${ctx.from.first_name} ${ctx.from.last_name}`,
    },
  );
  ctx.editMessageText(renderList());
});
bot.action('plusOne', (ctx) => {
  list.set(
    ctx.from.id,
    {
      id: ctx.from.id,
      name: `${ctx.from.first_name} ${ctx.from.last_name}`,
      plusOne: true,
    },
  );
  ctx.editMessageText(renderList());
});
bot.action('maybe', (ctx) => {
  list.set(
    ctx.from.id,
    {
      id: ctx.from.id,
      name: `${ctx.from.first_name} ${ctx.from.last_name}`,
      maybe: true,
    },
  );
  ctx.editMessageText(renderList());
});

app.get('/', (req, res) => {
  res.send('Bot is working...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
