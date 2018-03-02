const Telegraf = require('telegraf')
const isUrl = require('is-url')

const { customSearch, imageSearch } = require('./google')
const { reuseSearch, cacheSearch } = require('./search')
const { NedbCache } = require('./store')

const config = require('./config.json')

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

const bot = new Telegraf(config.bot.token)

bot.on('text', ({message, telegram}) => {
    const {text, chat} = messsage
    const queries = parse(text).filter(match => !isUrl(match))

    queries.forEach(async query => {
        try {
            const link = await search(query)
            if (query.endsWith('.gif')) {
                await telegram.sendDocument(chat.id, link)
            } else {
                await telegram.sendPhoto(chat.id, link)
            }
        } catch(err) {
            console.error(err)
        }
    })
})

bot.catch(console.error)

bot.startPolling()

