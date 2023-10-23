'use strict';
var { ReadPreference } = require('mongodb');
var { CollectionsExist } = require('../errors');

var verifyCollectionsDontExist = async (bag) => {
    var { dbHandle, collections, onCollectionExists } = bag;
    
    // see: node-mongodb-native (v3.6.9)
    //      /lib/operations/create_collection:76
    var existing = await (
        dbHandle
        .listCollections({ name: { $in: collections }})
        .withReadPreference(ReadPreference.PRIMARY)
        .toArray()
    );

    if (existing.length > 0) {
        if (onCollectionExists !== 'overwrite') {
            throw new CollectionsExist({ collections: [
                ...existing.map(it => it.name)
            ] });
        }

        return false;
    }
    else {
        return true;
    }
}

module.exports = verifyCollectionsDontExist;
