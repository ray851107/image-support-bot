const request = require('request-promise')
const cheerio = require('cheerio')

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
        let html = await request('https://www.google.com/search', { headers, qs })
        return this.parse(html)
    }
    parse (html) {
        const $ = cheerio.load(html)
        const json = $('.rg_meta').first().text()
        const data = JSON.parse(json)
        return data.ou
    }
}

const customSearch = new GoogleCustomSearch()
const imageSearch = new GoogleImageSearch()

module.exports = {customSearch, imageSearch}