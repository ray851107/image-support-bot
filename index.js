const Telegraf = require('telegraf')
const isUrl = require('is-url')

const { customSearch, imageSearch } = require('./google')
const { reuseSearch, cacheSearch } = require('./search')
const { LokiCache } = require('./loki-cache')

const config = require('./config.json')

const cache = new LokiCache('./loki-cache.db')

const search = reuseSearch(
    cacheSearch(chainSearch(customSearch, imageSearch), cache)
)

const parse = text => text.match(/\S+\.(jpg|png|bmp|gif)/gi) || []

const bot = new Telegraf(config.bot.token)

bot.on('text', ({ message, telegram }) => {
    const { text, chat } = message
    const queries = parse(text).filter(match => !isUrl(match))

    queries.forEach(async query => {
        try {
            const link = await search(query)
            if (query.endsWith('.gif')) {
                await telegram.sendDocument(chat.id, link)
            } else {
                await telegram.sendPhoto(chat.id, link)
            }
        } catch (err) {
            console.error(err)
        }
    })
})

bot.catch(console.error)

async function main() {
    try {
        await cache.load()
        bot.startPolling()
    } catch (err) {
        console.error(err)
    }
}

main()
