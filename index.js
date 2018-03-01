const TelegramBot = require('node-telegram-bot-api')
const isUrl = require('is-url')

const { customSearch, imageSearch } = require('./google')
const { reuseSearch, cacheSearch } = require('./search')
const { NedbCache } = require('./store')

const config = require('./config.json')

const bot = new TelegramBot(config.bot.token, { polling: true })

const search = reuseSearch(
    cacheSearch(async query => {
        try {
            return await customSearch(query)
        } catch (err) {
            return await imageSearch(query)
        }
    }, new NedbCache())
)

const parse = text => text.match(/\S+\.(jpg|png|bmp|gif)/gi) || []

bot.on('text', ({ chat, text }) => {
    const queries = parse(text).filter(match => !isUrl(match))
    for (const query of queries) {
        search(query)
            .then(link => {
                query.endsWith('.gif')
                    ? bot.sendDocument(chat.id, link)
                    : bot.sendPhoto(chat.id, link)
            })
            .catch(console.log)
    }
})
