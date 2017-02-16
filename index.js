const TelegramBot = require('node-telegram-bot-api')

const {customSearch, imageSearch} = require('./search')
const config = require('./config.json')

const bot = new TelegramBot(config.bot.token, { polling: true })

const search = customSearch.alt(imageSearch).cache()

const parse = text => text.match(/\S+\.(jpg|png|bmp|gif)/gi) || []

bot.on('text', async ({chat, text}) => {
    const queries = parse(text)
    try {
        await Promise.all(queries.map(async (query) => {
            const link = await search.doSearch(query)
            if (query.endsWith('.gif')) {
                await bot.sendDocument(chat.id, link)
            } else {
                await bot.sendPhoto(chat.id, link)
            }
        }))
    } catch (err) {
        console.error(err)
    }
})
