'use strict';
var { ReadPreference } = require('mongodb');
var { CollectionExists } = require('../errors');

var tryCreateCollection = async ({
    dbHandle,
    collection,
    onCollectionExists
}) => {
    if (onCollectionExists !== 'overwrite') {
        // see: node-mongodb-native (v3.6.9)
        //      /lib/operations/create_collection:76
        var existing = await (
            dbHandle
            .listCollections({ name: collection })
            .setReadPreference(ReadPreference.PRIMARY)
            .toArray()
        );
        if (existing.length) {
            throw new CollectionExists({ collection });
        }
    }
    await dbHandle.createCollection(collection);
}

module.exports = tryCreateCollection;
