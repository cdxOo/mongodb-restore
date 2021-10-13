'use strict';
var fs = require('fs'),
    BSON = require('bson');

var {
    maybeConnectServer,
    internalRestoreBuffer,
    tryCreateCollection
} = require('./utils');

module.exports = (options) => {
    checkOptions(options);
    return doRestoreCollection(options);
}

var doRestoreCollection = async ({
    con,
    uri,
    database,
    collection,
    from,

    limit,
    clean = true,
    onCollectionExists = 'throw',
}) => {
    var serverConnection = await maybeConnectServer({ con, uri });

    try {
        var dbHandle = serverConnection.db(database),
            dbCollection = dbHandle.collection(collection);
      
        await tryCreateCollection({
            dbHandle,
            collection,
            onCollectionExists
        });

        if (clean) {
            await dbCollection.deleteMany({});
        }
        
        // FIXME: this will blow up on large collections
        var buffer = fs.readFileSync(from);

        await internalRestoreBuffer({
            collectionHandle: dbCollection,
            buffer,
            limit
        });
    }
    finally {
        if (!con) {
            serverConnection.close()
        }
    }
};


var checkOptions = ({
    con,
    uri,
    database,
    collection,
    from,
    onCollectionExists,
}) => {
    if (!con && !uri) {
        throw new Error('neither "con" nor "uri" option was given');
    }

    if (con && uri) {
        throw new Error('you cannot use both "uri" and "con" option');
    }

    if (!database) {
        throw new Error('missing "database" option');
    }

    if (!collection) {
        throw new Error('missing "collection" option');
    }

    if (!from) {
        throw new Error('missing "from" option');
    }

    if (
        onCollectionExists
        && !['throw', 'overwrite'].includes(onCollectionExists)
    ) {
        throw new Error('when set "onCollectionExists" should be either "throw" or "overwrite"');
    }
}
