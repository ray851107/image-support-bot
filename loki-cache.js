const Loki = require('lokijs')

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000

class LokiCache {
    constructor(filename, ttl = MILLIS_PER_DAY) {
        this.db = new Loki(filename, { autosave: true, autosaveInterval: 5000 })
        this.ttl = ttl
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
                ttl: this.ttl,
                ttlInterval: MILLIS_PER_DAY
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
