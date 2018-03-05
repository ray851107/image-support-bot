const Loki = require('lokijs')

class LokiCache {
    constructor(filename, ttl = 24 * 60 * 60 * 1000) {
        this.db = new Loki(filename, { autosave: true, autosaveInterval: 5000 })
        this.entries = null
    }

    async load() {
        await new Promise((resolve, reject) => {
            this.db.loadDatabase({}, err => (err ? reject(err) : resolve()))
        })

        this.entries = this.db.getCollection('entries')

        if (this.entries == null) {
            this.entries = this.db.addCollection('entries', {
                unique: ['query'],
                ttl: ttl,
                ttlInterval: 24 * 60 * 60 * 1000
            })
        }
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
