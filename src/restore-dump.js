'use strict';
var fs = require('fs');
var fspath = require('path');
var restoreDatabase = require('./restore-database');

var { maybeConnectServer } = require('./utils');

module.exports = (options) => {
    checkOptions(options);
    return doRestoreDump(options);
}

var doRestoreDump = async (bag) => {
    var {
        con,
        uri,
        from,

        clean = true,
        onCollectionExists = 'throw',
        transformDocuments
    } = bag;

    var serverConnection = await maybeConnectServer({ con, uri });

    var databases = (
        fs.readdirSync(from)
        .map(filename => ({
            name: filename,
            path: fspath.join(from, filename)
        }))
        .filter(it => fs.statSync(it.path).isDirectory())
    );

    try {
        // TODO: handle erroneous database restores properly
        await Promise.all(
            databases.map(({ name, path }) => {
                var wrappedTransform = undefined;
                if (transformDocuments) {
                    wrappedTransform = (doc, info = {}) => (
                        transformDocuments(doc, { ...info, database: name })
                    );
                }
                return restoreDatabase({
                    con: serverConnection,
                    database: name,
                    from: path,

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
        from,
        onCollectionExists
    } = bag;

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
