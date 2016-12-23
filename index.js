const TelegramBot = require('node-telegram-bot-api')
const request = require('request-promise')

const config = require('./config.json')

const bot = new TelegramBot(config.bot.token, { polling: true })

const googleSearch = query =>
    request('https://www.googleapis.com/customsearch/v1', {
        qs: {
            key: config.cse.key,
            cx: config.cse.cx,
            q: query,
            fileType: query.endsWith('.gif') ? 'gif' : undefined,
            searchType: 'image',
            hl: 'zh-TW',
            num: 1
        },
        json: true
    })
    .then(body => body.items[0].link)

const search = (function () {
    const cache = new Map()
    return query => cache.has(query)
        ? Promise.resolve(cache.get(query))
        : googleSearch(query).then(link => {
            cache.set(query, link)
            return link
        })
}())

const parse = (text) => text.match(/\S+\.(jpg|png|bmp|gif)/gi) || []

bot.on('text', ({chat, text}) => {
    parse(text).forEach(query => {
        search(query).then(link => {
            if (query.endsWith('.gif')) {
                bot.sendDocument(chat.id, link)
            } else {
                bot.sendPhoto(chat.id, link)
            }
        })
    })
})
