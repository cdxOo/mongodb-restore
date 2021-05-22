'use strict';
var fs = require('fs'),
    fspath = require('path'),
    MongoClient = require('mongodb').MongoClient,
    restoreDatabase = require('./restore-database');

module.exports = (options) => {
    checkOptions(options);
    return doRestoreDump(options);
}

var doRestoreDump = async ({
    con,
    uri,
    from,

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

    var databases = (
        fs.readdirSync(from)
        .map(filename => ({
            name: filename,
            path: fspath.join(from, filename)
        }))
        .filter(it => fs.statSync(it.path).isDirectory())
    );

    // TODO: handle erroneous database restores properly
    await Promise.all(
        databases.map(({ name, path }) => (
            restoreDatabase({
                con: serverConnection,
                database: name,
                from: path,

                clean,
                onCollectionExists,
            })
        ))
    );
        
    if (!con) {
        serverConnection.close()
    }
}

var checkOptions = ({
    con,
    uri,
    from,
    onCollectionExists
}) => {
    if (!con && !uri) {
        throw new Error('neither "con" nor "uri" option was given');
    }

    if (con && uri) {
        throw new Error('you cannot use both "uri" and "con" option');
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
