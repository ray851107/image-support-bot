const datastore = require('nedb-promise')

class NedbCache {
    constructor (expireAfterSeconds = 24 * 60 * 60, filename = './store.db') {
        this.db = datastore({ filename, autoload: true, timestampData: true })
        this.init = Promise.all([
            this.db.ensureIndex({ fieldName: 'query', unique: true }),
            this.db.ensureIndex({ fieldName: 'updatedAt', expireAfterSeconds })
        ])
    }

    async get (query) {
        await this.init

        const docs = await this.db.find({ query })
        if (docs.length === 0) return undefined
        return docs[0].data
    }

    async set (query, data) {
        await this.init
        await this.db.update({ query }, { query, data }, { upsert: true })
        return data
    }
}

module.exports = { NedbCache }