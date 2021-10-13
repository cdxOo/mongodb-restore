'use strict';
var MongoClient = require('mongodb').MongoClient;

var maybeConnectServer = async ({ con, uri }) => {
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
    return serverConnection;
}

module.exports = maybeConnectServer;
