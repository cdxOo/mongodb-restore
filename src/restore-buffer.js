'use strict';
var {
    maybeConnectServer,
    internalRestoreBuffer,
    tryCreateCollection
} = require('./utils');

module.exports = (options) => {
    checkOptions(options);
    return doRestoreBuffer(options);
}

var doRestoreBuffer = async ({
    con,
    uri,
    database,
    collection,

    from,
    //chunked = false,
    
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
        
        await internalRestoreBuffer({
            collectionHandle: dbCollection,
            buffer: from,
            limit
        });
    }
    finally {
        if (!con) {
            serverConnection.close()
        }
    }
}

var checkOptions = ({
    con,
    uri,
    database,
    collection,
    from,
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
    else if (!Buffer.isBuffer(from)) {
        throw new Error('value of "from" option must be a buffer');
    }
}
