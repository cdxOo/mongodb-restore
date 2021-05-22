'use strict';
var fs = require('fs'),
    MongoClient = require('mongodb').MongoClient,
    BSON = require('bson');

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
    var serverConnection;
    if (!con) {
        serverConnection = (await MongoClient.connect(
            uri,
            { useUnifiedTopology: true }
        ));
    }
    else {
        serverConnection = con;
    }

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

        if (documents.length > 0) {
            await dbCollection.insertMany(documents);
        }
    }
    finally {
        if (!con) {
            serverConnection.close()
        }
    }
};

var tryCreateCollection = async ({
    dbHandle,
    collection,
    onCollectionExists
}) => {
    try {
        await dbHandle.createCollection(collection);
    }
    catch (error) {
        if (error.codeName === 'NamespaceExists') {
            if (onCollectionExists !== 'overwrite') {
                throw new Error(`collection "${collection}" already exists; set onCollectionExists to "overwrite" to remove this error`);
            }
        }
        else {
            throw error;
        }
    }
}

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
