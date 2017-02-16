const request = require('request-promise')
const config = require('./config.json')

class Search {
    async doSearch (query) {
        throw Error('search method not provided')
    }
    alt (other) {
        return new AltSearch(this, other)
    }
    cache () {
        return new CacheSearch(this)
    }
}

class AltSearch extends Search {
    constructor (search1, search2) {
        this.search1 = search1
        this.search2 = search2
    }
    async doSearch (query) {
        try {
            return await search1.doSearch(query)
        } catch (err) {
            return await search2.doSearch(query)
        }
    }
}

class CacheSearch extends Search {
    constructor (search) {
        this.cache = new Map()
        this.search = search
    }
    async doSearch (query) {
        if (this.cache.has(query)) {
            return await this.cache.get(query)
        }
        const promise = this.search.doSearch(query)
        this.cache.add(query, promise)
        try {
            return await promise
        } catch (err) {
            this.cache.delete(query)
            throw err
       }
    }
}

class GoogleSearch extends Search {
    async doSearch (query) {
        const qs = Object.assign({
            q: query,
            fileType: query.endsWith('.gif') ? 'gif' : undefined
        }, GoogleSearch.defaults, config.params)

        const body = await request('https://www.googleapis.com/customsearch/v1', { qs, json: true })
        
        return body.items[0].link
    }
    static defaults = {
        key: config.cse.key,
        cx: config.cse.cx,
        searchType: 'image',
        hl: 'zh-TW',
        num: 1
    }
}

const googleSearch = new GoogleSearch()

const defaultSearch = googleSearch.cache()

module.exports = { googleSearch, defaultSearch }