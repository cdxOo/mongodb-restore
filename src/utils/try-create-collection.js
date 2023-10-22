'use strict';
var verifyCollectionsDontExist = require('./verify-collections-dont-exist');

var tryCreateCollection = async (bag) => {
    var { dbHandle, collection, onCollectionExists } = bag;

    var doesntExist = await verifyCollectionsDontExist({
        dbHandle,
        collections: [ collection ],
        onCollectionExists
    })
    
    if (doesntExist) {
        await dbHandle.createCollection(collection);
    }
}

module.exports = tryCreateCollection;
