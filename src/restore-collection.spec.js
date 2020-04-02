'use strict';
var expect = require('chai').expect,
    fspath = require('path'),
    Mongod = require('mongodb-memory-server').MongoMemoryServer,
    { MongoClient, ObjectId } = require('mongodb'),
    restore = require('./restore-collection');

describe('restore-collection', () => {
    
    var server, uri, dbName, serverConnection;
    beforeEach(async () => {
        server = new Mongod();
        await server.start();
        ({ uri, dbName } = server.getInstanceInfo())
    });

    afterEach(async () => {
        if (serverConnection) {
            serverConnection.close();
        }
        await server.stop();
    })
    
    it('restores fixtures to collection (new con)', async () => {
        await restore({
            uri,
            database: dbName,
            collection: 'foo',
            from: fspath.join(
                __dirname,
                '..', 'fixtures', 'restore-collection', 'foo.bson'
            )
        });
        
        serverConnection = await MongoClient.connect(
            uri,
            { useUnifiedTopology: true}
        );
        
        var documents = await (
            serverConnection
            .db(dbName)
            .collection('foo')
            .find()
            .toArray()
        );

        expect(documents)
            .to.be.an('array')
            .with.length(2);
        
        expect(
            documents[0]._id.equals(ObjectId('5e8621d8e0dddbe18c80492d'))
        ).to.equal(true)
        expect(
            documents[1]._id.equals(ObjectId('5e8621ede0dddbe18c80492e'))
        ).to.equal(true)

        expect(documents[0].myprop).to.equal("one");
        expect(documents[1].myprop).to.equal("two");

    });
    
    it('restores fixtures to collection (existing con)', async () => {
        serverConnection = await MongoClient.connect(
            uri,
            { useUnifiedTopology: true}
        );
        
        await restore({
            con: serverConnection,
            database: dbName,
            collection: 'foo',
            from: fspath.join(
                __dirname,
                '..', 'fixtures', 'restore-collection', 'foo.bson'
            )
        });
        
        var documents = await (
            serverConnection
            .db(dbName)
            .collection('foo')
            .find()
            .toArray()
        );

        expect(documents)
            .to.be.an('array')
            .with.length(2);
        
    });
});
