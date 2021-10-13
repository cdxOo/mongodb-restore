'use strict';
var BSON = require('bson');

var internalRestoreBuffer = async ({
    collectionHandle,

    buffer,
    limit,
    // chunked = false
    transformDocuments,
}) => {
    var index = 0,
        documents = [];
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
