'use strict';
var MongoClient = require('mongodb').MongoClient;

var maybeConnectServer = async (bag) => {
    var { con, uri } = bag;

    var serverConnection;
    if (!con) {
        serverConnection = await MongoClient.connect(
            uri,
            { useUnifiedTopology: true }
        );
    }
    else {
        serverConnection = con;
    }
    return serverConnection;
}

module.exports = maybeConnectServer;
