class PromiseCache {
    constructor(cache) {
        this.pending = new Map()
        this.cache = cache
    }
    get(query) {
        return this.pending.has(query)
            ? this.pending.get(query)
            : this.cache.get(query)
    }
    async set(query, promise) {
        this.pending.set(query, promise)
        try {
            const data = await promise
            return await this.cache.set(query, data)
        } finally {
            this.pending.delete(query)
        }
    }
}

function cacheSearch(search, rawCache) {
    const cache = new PromiseCache(rawCache)

    return async query => {
        const data = await cache.get(query)
        if (data != null) return data

        const promise = search(query)

        return await cache.set(query, promise)
    }
}

module.exports = { cacheSearch }
