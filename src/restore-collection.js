'use strict';
var fs = require('fs'),
    MongoClient = require('mongodb').MongoClient,
    BSON = require('bson');

module.exports = (options) => {
    checkOptions(options);
    return doRestoreCollection(options);
}

const doRestoreCollection = async ({
    con,
    uri,
    database,
    collection,
    from,

    clean = true,
    limit,
}) => {
    var serverConnection;
    if (!con) {
        serverConnection = (await MongoClient.connect(
            uri,
            { useUnifiedTopology: true}
        ))
    }
    else {
        serverConnection = con;
    }

    var dbCollection = (
        serverConnection
        .db(database)
        .collection(collection)
    );
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

    await dbCollection.insertMany(documents);

    if (!con) {
        serverConnection.close()
    }
};

var checkOptions = ({
    con,
    uri,
    database,
    collection,
    from
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
}
