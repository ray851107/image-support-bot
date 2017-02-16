class Search {
    async doSearch (query) {
        throw Error('search method not provided')
    }
    alt (other) {
        return new AltSearch(this, other)
    }
    cache (cache) {
        return new CacheSearch(this, cache)
    }
}

class AltSearch extends Search {
    constructor (search1, search2) {
        super()
        this.search1 = search1
        this.search2 = search2
    }
    doSearch (query) {
        return this.search1.doSearch(query)
            .catch(() => this.search2.doSearch(query))
    }
}

class PromiseCache {
    constructor (cache) {
        this.pending = new Map()
        this.cache = cache
    }
    async get (query) {
        if (this.pending.has(query)) {
            return await this.pending.get(query)
        }
        return await this.cache.get(query)
    }
    async set (query, promise) {
        this.pending.set(query, promise)
        try {
            const data = await promise
            this.pending.delete(query)
            return await this.cache.set(query, data)
        } catch (err) {
            this.pending.delete(query)
            throw err
        }
    }
}

class CacheSearch extends Search {
    constructor (search, cache) {
        super()
        this.cache = new PromiseCache(cache)
        this.search = search
    }
    async doSearch (query) {
        const data = await this.cache.get(query)
        if (data != null) return data

        const promise = this.search.doSearch(query)
        
        return await this.cache.set(query, promise)
    }
}

module.exports = { Search }