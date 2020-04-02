'use strict';
var expect = require('chai').expect,
    fspath = require('path'),
    Mongod = require('mongodb-memory-server').MongoMemoryServer,
    { MongoClient, ObjectId } = require('mongodb'),
    restore = require('./restore-database');

describe('restore-database', () => {
    
    var dbName = 'db-1',
        server, uri, serverConnection;
    beforeEach(async () => {
        server = new Mongod({
            instance: { dbName }
        });
        await server.start();
        ({ uri, dbName } = server.getInstanceInfo())
    });

    afterEach(async () => {
        if (serverConnection) {
            serverConnection.close();
        }
        await server.stop();
    });
    
    it('restores fixtures to database', async () => {
        await restore({
            uri,
            database: dbName,
            from: fspath.join(
                __dirname,
                '..', 'fixtures', 'restore-database', dbName
            )
        });
        
        serverConnection = await MongoClient.connect(
            uri,
            { useUnifiedTopology: true}
        );
        
        var foo = await (
            serverConnection
            .db(dbName)
            .collection('foo')
            .find()
            .toArray()
        );

        expect(foo)
            .to.be.an('array')
            .with.length(2);
        
        expect(
            foo[0]._id.equals(ObjectId('5e8621d8e0dddbe18c80492d'))
        ).to.equal(true)
        expect(
            foo[1]._id.equals(ObjectId('5e8621ede0dddbe18c80492e'))
        ).to.equal(true)

        expect(foo[0].myprop).to.equal("one");
        expect(foo[1].myprop).to.equal("two");

        var bar = await (
            serverConnection
            .db(dbName)
            .collection('bar')
            .find()
            .toArray()
        );

        expect(bar)
            .to.be.an('array')
            .with.length(2);
        
        expect(
            bar[0]._id.equals(ObjectId('5e86396fb2953ac1cc5dc524'))
        ).to.equal(true)
        expect(
            bar[1]._id.equals(ObjectId('5e86396fb2953ac1cc5dc525'))
        ).to.equal(true)

        expect(bar[0].myprop).to.equal("three");
        expect(bar[1].myprop).to.equal("four");

    });

});
