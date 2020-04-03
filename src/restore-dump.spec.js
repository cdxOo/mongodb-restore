'use strict';
var expect = require('chai').expect,
    fspath = require('path'),
    Mongod = require('mongodb-memory-server').MongoMemoryServer,
    { MongoClient, ObjectId } = require('mongodb'),
    restore = require('./restore-dump');

describe('restore-dump', () => {
    
    var dump = 'dump-1',
        server, uri, serverConnection;
    beforeEach(async () => {
        server = new Mongod();
        await server.start();
        ({ uri } = server.getInstanceInfo())
    });

    afterEach(async () => {
        if (serverConnection) {
            serverConnection.close();
        }
        await server.stop();
    });
    
    it('restores fixtures to multiple databases', async () => {
        await restore({
            uri,
            from: fspath.join(
                __dirname,
                '..', 'fixtures', 'restore-dump', dump
            )
        });
        
        serverConnection = await MongoClient.connect(
            uri,
            { useUnifiedTopology: true}
        );

        var db1 = serverConnection.db('db-1');

        var foo = await (
            db1
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
            db1
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

        var db2 = serverConnection.db('db-2');

        var alice = await (
            db2
            .collection('alice')
            .find()
            .toArray()
        );

        expect(alice)
            .to.be.an('array')
            .with.length(1);
        
        expect(
            alice[0]._id.equals(ObjectId('5e86b7f093ebfbc68650f90a'))
        ).to.equal(true)

        expect(alice[0].myprop).to.equal("alice");

    });

});
