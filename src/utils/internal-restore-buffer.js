'use strict';
var BSON = require('bson');

var internalRestoreBuffer = async (bag) => {
    var {
        collectionHandle,

        buffer,
        limit,
        // chunked = false
        filterDocuments,
        transformDocuments,
    } = bag;

    var index = 0;
    var documents = [];
    while (
        buffer.length > index
        && (!limit || limit > documents.length)
    ) {
        var tmp = [];
        index = BSON.deserializeStream(
            buffer, // bsonBuffer
            index,  // deserializationStartIndex,
            1,      // numberOfDocuments
            tmp,    // targetArray
            0,      // targetArrayStartIndex,
            // {}   // options
        );
        documents.push(...(
            filterDocuments
            ? tmp.filter(filterDocuments)
            : tmp
        ));
    }
    
    if (transformDocuments) {
        documents = documents.map(transformDocuments);
    }

    if (documents.length > 0) {
        await collectionHandle.insertMany(documents);
    }
}

module.exports = internalRestoreBuffer;
