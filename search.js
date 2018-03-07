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
        const data = cache.get(query)
        if (data != null) return data

        const newData = await search(query)
        cache.set(query, newData)
        return newData
    }
}

function chainSearch(search, fallbackSearch) {
    return async query => {
        try {
            return await search(query)
        } catch (err) {
            return await fallbackSearch(query)
        }
    }
}

module.exports = { reuseSearch, cacheSearch, chainSearch }
