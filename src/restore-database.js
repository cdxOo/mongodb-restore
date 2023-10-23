'use strict';
var fs = require('fs');
var fspath = require('path');
var restoreCollection = require('./restore-collection');

var {
    maybeConnectServer,
    verifyCollectionsDontExist,
} = require('./utils');

module.exports = (options) => {
    checkOptions(options);
    return doRestoreDatabase(options);
}

var doRestoreDatabase = async (bag) => {
    var {
        con,
        uri,
        database,
        from,

        clean = true,
        onCollectionExists = 'throw',
        transformDocuments,
    } = bag;
    
    var bsonRX = /\.bson$/;

    var serverConnection = await maybeConnectServer({ con, uri });
    var dbHandle = serverConnection.db(database);

    var collections = (
        fs.readdirSync(from)
        .filter(filename => bsonRX.test(filename))
        .map(filename => ({
            filename,
            mongoname: filename.replace(bsonRX, ''),
        }))
    );

    try {
        await verifyCollectionsDontExist({
            dbHandle,
            collections: collections.map(it => it.mongoname),
            onCollectionExists,
        });

        await Promise.all(
            collections.map(({ filename, mongoname }) => {
                var wrappedTransform = undefined;
                if (transformDocuments) {
                    wrappedTransform = (doc, info = {}) => (
                        transformDocuments(doc, {
                            ...info,
                            collection: mongoname
                        })
                    );
                }
                return restoreCollection({
                    con: serverConnection,
                    database,
                    collection: mongoname,
                    from: fspath.join(from, filename),

                    clean,
                    onCollectionExists,
                    transformDocuments: wrappedTransform
                })
            })
        );
    }
    finally {
        if (!con) {
            serverConnection.close()
        }
    }
}

var checkOptions = (bag) => {
    var {
        con,
        uri,
        database,
        from,
        onCollectionExists,
    } = bag;

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
