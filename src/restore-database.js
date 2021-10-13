'use strict';
var fs = require('fs'),
    fspath = require('path'),
    restoreCollection = require('./restore-collection');

var { maybeConnectServer } = require('./utils');

module.exports = (options) => {
    checkOptions(options);
    return doRestoreDatabase(options);
}

var doRestoreDatabase = async ({
    con,
    uri,
    database,
    from,

    clean = true,
    onCollectionExists = 'throw',
}) => {
    var serverConnection = await maybeConnectServer({ con, uri });
    var bsonRX = /\.bson$/;

    var collectionFiles = (
        fs.readdirSync(from)
        .filter(filename => bsonRX.test(filename))
    );
    
    // TODO: handle erroneous collection restores properly
    await Promise.all(
        collectionFiles.map(filename => (
            restoreCollection({
                con: serverConnection,
                database,
                collection: filename.replace(bsonRX, ''),
                from: fspath.join(from, filename),

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
    database,
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
