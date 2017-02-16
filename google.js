const request = require('request-promise')
const htmlparser2 = require('htmlparser2')

const config = require('./config')
const {Search} = require('./search')

class GoogleCustomSearch extends Search {
    async doSearch (query) {
        const qs = Object.assign({
            q: query,
            fileType: query.endsWith('.gif') ? 'gif' : undefined
        }, GoogleCustomSearch.defaults, config.params)

        const body = await request('https://www.googleapis.com/customsearch/v1', { qs, json: true })
        
        return body.items[0].link
    }
}

GoogleCustomSearch.defaults = {
    key: config.cse.key,
    cx: config.cse.cx,
    searchType: 'image',
    hl: 'zh-TW',
    num: 1
}

class GoogleImageSearch extends Search {
    async doSearch (query) {
        const headers = {
            ['User-Agent']: 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
            DNT: 1
        }
        const qs = {
            q: query,
            tbs: query.endsWith('.gif') ? 'ift:gif' : undefined,
            tbm: 'isch',
            hl: 'zh-TW',
            num: 1
        }
        const stream = request('https://www.google.com/search', { headers, qs, encoding: 'utf8' })
        const json = await this.parse(stream)
        return JSON.parse(json).ou
    }
    parse (stream) {
        return new Promise((resolve, reject) => {
            let parsing = false
            let found = false
            let result = ''

            const parser = new htmlparser2.Parser({
                onopentag (name, attributes) {
                    if (found || attributes.class !== 'rg_meta') return
                    parsing = true
                    found = true
                },
                ontext (text) {
                    if (parsing) {
                        result += text
                    }
                },
                onclosetag () {
                    if (!parsing) return
                    parsing = false
                    resolve(result)
                },
                onend () {
                    if (!found) reject(new Error('link not found'))
                },
                onerror: reject
            })
            stream.on('error', reject)
            stream.on('data', data => {
                parser.write(data)
            })
            stream.on('end', () => {
                parser.end()
            })
        })
    }
}

const customSearch = new GoogleCustomSearch()
const imageSearch = new GoogleImageSearch()

module.exports = {customSearch, imageSearch}