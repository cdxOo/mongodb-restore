'use strict';
var BSON = require('bson');

var internalRestoreBuffer = async (bag) => {
    var {
        collectionHandle,

        buffer,
        limit,
        // chunked = false
        transformDocuments,
    } = bag;

    var index = 0;
    var documents = [];
    while (
        buffer.length > index
        && (!limit || limit > documents.length)
    ) {
        index = BSON.deserializeStream(
            buffer,
            index,
            1,
            documents,
            documents.length
        );
    }

    if (transformDocuments) {
        documents = documents.map(transformDocuments);
    }

    if (documents.length > 0) {
        await collectionHandle.insertMany(documents);
    }
}

module.exports = internalRestoreBuffer;
