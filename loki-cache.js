const Loki = require('lokijs')

class LokiCache {
    constructor(filename, ttl = 24 * 60 * 60 * 1000) {
        this.db = new Loki(filename, { autosave: true })
        this.entries = this.db.addCollection('entries', {
            unique: ['query'],
            ttl: ttl,
            ttlInterval: 24 * 60 * 60 * 1000
        })
    }

    load() {
        return new Promise((resolve, reject) => {
            this.db.loadDatabase({}, err => (err ? reject(err) : resolve()))
        })
    }

    get(query) {
        const doc = this.entries.by('query', query)
        return doc != null ? doc.data : null
    }

    set(query, data) {
        this.entries.insert({ query, data })
    }
}

module.exports = { LokiCache }
