'use strict';
var { MongoMemoryServer } = require('mongodb-memory-server');
var { MongoClient } = require('mongodb');

var createServer = async () => {
    var server = new MongoMemoryServer();
    await server.start();
    
    var { uri, dbName } = server.getInstanceInfo();

    return {
        server,
        uri,
        dbName
    }
}

var connectServer = async ({ uri, dbName }) => {
    var serverConnection = await MongoClient.connect(
        uri,
        { useUnifiedTopology: true}
    );

    var dbHandle = serverConnection.db(dbName);

    return {
        serverConnection,
        dbHandle
    };
}

var findInCollection = ({ dbHandle, collection, filter }) => {
    return (
        dbHandle
        .collection(collection)
        .find(filter || {})
        .toArray()
    )
}

var initTestEnv = async () => {
    var { server, uri, dbName } = await createServer();
    
    var {
        serverConnection,
        dbHandle
    } = await connectServer({ uri, dbName });

    return {
        server,
        uri,
        dbName,
        serverConnection,
        dbHandle
    }
}

module.exports = {
    createServer,
    connectServer,

    initTestEnv,
    findInCollection,
}
