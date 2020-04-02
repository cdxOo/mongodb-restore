var fs = require('fs'),
    fspath = require('path'),
    MongoClient = require('mongodb').MongoClient,
    restoreCollection = require('./restore-collection');

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
}) => {
    if (!con) {
        serverConnection = (await MongoClient.connect(
            uri,
            { useUnifiedTopology: true}
        ));
    }
    else {
        serverConnection = con;
    }

    var bsonRX = /\.bson$/;

    var collectionFiles = (
        fs.readdirSync(from)
        .filter(filename => bsonRX.test(filename))
    );
    
    await Promise.all(
        collectionFiles.map(filename => (
            restoreCollection({
                con: serverConnection,
                database,
                collection: filename.replace(bsonRX, ''),
                from: fspath.join(from, filename),
                clean
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

    if (!from) {
        throw new Error('missing "from" option');
    }
}
