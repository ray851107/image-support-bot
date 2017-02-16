const TelegramBot = require('node-telegram-bot-api')
const request = require('request-promise')

const config = require('./config.json')

const bot = new TelegramBot(config.bot.token, { polling: true })

async function googleSearch (query) {
    const defaults = {
        key: config.cse.key,
        cx: config.cse.cx,
        searchType: 'image',
        hl: 'zh-TW',
        num: 1
    }

    const qs = Object.assign({
        q: query,
        fileType: query.endsWith('.gif') ? 'gif' : undefined
    }, defaults, config.params)

    const body = await request('https://www.googleapis.com/customsearch/v1', { qs, json: true })
    
    return body.items[0].link
}

function addCache (search) {
    const cache = new Map()

    return async (query) => {
        if (cache.has(query)) {
            return await cache.get(query)
        }
        const promise = search(query)
        cache.add(query, promise)
        try {
            return await promise
        } catch (err) {
            cache.delete(query)
            throw err
        }
    }
}

const search = addCache(googleSearch)

const parse = text => text.match(/\S+\.(jpg|png|bmp|gif)/gi) || []

bot.on('text', async ({chat, text}) => {
    const queries = parse(text)
    try {
        await Promise.all(queries.map(async (query) => {
            const link = await search(query)
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
