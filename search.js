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
        super()
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
        super()
        this.cache = new Map()
        this.search = search
    }
    async doSearch (query) {
        if (this.cache.has(query)) {
            return await this.cache.get(query)
        }
        const promise = this.search.doSearch(query)
        this.cache.set(query, promise)
        try {
            return await promise
        } catch (err) {
            this.cache.delete(query)
            throw err
       }
    }
}

module.exports = { Search }