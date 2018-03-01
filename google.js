const fetch = require('node-fetch')
const htmlparser2 = require('htmlparser2')
const https = require('https')
const qs = require('qs')

const config = require('./config')

async function customSearch(query) {
    const params = {
        q: query,
        fileType: query.endsWith('.gif') ? 'gif' : undefined,

        key: config.cse.key,
        cx: config.cse.cx,

        searchType: 'image',
        hl: 'zh-TW',
        num: 1,
        ...config.params
    }

    const res = await fetch(endpoint + '?' + qs.stringify(params))
    const data = await res.json()

    return data.items[0].link
}

async function imageSearch(query) {
    const params = {
        q: query,
        tbs: query.endsWith('.gif') ? 'ift:gif' : undefined,
        tbm: 'isch',
        hl: 'zh-TW',
        num: 1
    }

    const headers = {
        'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
        DNT: '1'
    }

    const res = await fetch(
        `https://www.google.com/search?${qs.stringify(params)}`,
        { headers }
    )

    const data = await parseImageSearch(res.body)

    return data.ou
}

function parseImageSearch(stream) {
    return new Promise((resolve, reject) => {
        let parsing = false
        let found = false
        let result = ''

        const parser = new htmlparser2.WritableStream({
            onopentag(name, attributes) {
                const className = attributes.class
                if (!found && className != null && /(^|\s)rg_meta($|\s)/.test(className)) {
                    parsing = true
                }
            },
            ontext(text) {
                if (parsing) result += text
            },
            onclosetag() {
                if (!parsing) return

                found = true
                parsing = false

                stream.destroy()
                parser.destroy()

                try {
                    resolve(JSON.parse(result))
                } catch (err) {
                    reject(err)
                }
            },
            onend() {
                if (!found) reject(new Error('link not found'))
            },
            onerror(err) {
                if (!found) reject(err)
            }
        })

        stream.pipe(parser)
    })
}

module.exports = { customSearch, imageSearch }
