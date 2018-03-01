function reuseSearch(search) {
    const running = new Map()
    return async query => {
        if (running.has(query)) return running.get(query)
        const promise = search(query)
        running.set(query, promise)
        try {
            return await promise
        } finally {
            running.delete(query)
        }
    }
}

function cacheSearch(search, cache) {
    return async query => {
        const data = await cache.get(query)
        if (data != null) return data

        const promise = search(query)

        return await cache.set(query, promise)
    }
}

module.exports = { reuseSearch, cacheSearch }
