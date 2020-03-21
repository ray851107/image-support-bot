const Telegraf = require('telegraf');
const isUrl = require('is-url');

const { customSearch, imageSearch } = require('./google');

const config = require('./config.json');

async function search(query) {
  try {
    return await customSearch(query);
  } catch (e) {
    return await imageSearch(query);
  }
}

function isImage(text) {
  return /\.(jpg|png|bmp|gif)$/.test(text);
}

const bot = new Telegraf(config.bot.token);

bot.on('text', ({ message, telegram }) => {
  const { text, chat } = message;
  const queries = text
    .split('\n')
    .map(s => s.trim())
    .filter(s => isImage(s) && !isUrl(s));
  queries.forEach(async query => {
    try {
      const link = await search(query);
      if (query.endsWith('.gif')) {
        await telegram.sendDocument(chat.id, link);
      } else {
        await telegram.sendPhoto(chat.id, link);
      }
    } catch (err) {
      console.error(err);
    }
  });
});

bot.catch(console.error);

async function main() {
  try {
    await bot.launch({
      polling: { timeout: 3 }
    });
  } catch (err) {
    console.error(err);
  }
}

main();
