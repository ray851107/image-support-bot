const TelegramBot = require('node-telegram-bot-api')
const isUrl = require('is-url')

const { customSearch, imageSearch } = require('./google')
const { cacheSearch } = require('./cache-search')
const { NedbCache } = require('./store')

const config = require('./config.json')

const bot = new TelegramBot(config.bot.token, { polling: true })

const search = cacheSearch(async query => {
    try {
        return customSearch(query)
    } catch (err) {
        return imageSearch(query)
    }
}, new NedbCache())

const parse = text => text.match(/\S+\.(jpg|png|bmp|gif)/gi) || []

bot.on('text', async ({ chat, text }) => {
    const queries = parse(text).filter(match => !isUrl(match))
    try {
        await Promise.all(
            queries.map(async query => {
                const link = await search.doSearch(query)
                if (query.endsWith('.gif')) {
                    await bot.sendDocument(chat.id, link)
                } else {
                    await bot.sendPhoto(chat.id, link)
                }
            })
        )
    } catch (err) {
        console.error(err)
    }
})
