'use strict';
var expect = require('chai').expect,
    fspath = require('path'),
    { ObjectId } = require('mongodb');

var {
    initTestEnv,
    findInCollection,
    ejson,
} = require('./test-helpers');

var restore = require('./restore-collection');


describe('restore-collection', () => {
    
    var server,
        uri,
        dbName,

        serverConnection,
        dbHandle;

    beforeEach(async () => {
        ({
            server,
            uri,
            dbName,

            serverConnection,
            dbHandle,
        } = await initTestEnv())
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
     
        var documents = await findInCollection({
            dbHandle,
            collection: 'foo'
        })
        
        expect(documents)
            .to.be.an('array')
            .with.length(2);
      
        expect(ejson(documents)).to.eql(ejson([
            {
                _id: ObjectId('5e8621d8e0dddbe18c80492d'),
                myprop: 'one',
            },
            {
                _id: ObjectId('5e8621ede0dddbe18c80492e'),
                myprop: 'two',
            }
        ]))

    });
    
    it('restores fixtures to collection (existing con)', async () => {
        await restore({
            con: serverConnection,
            database: dbName,
            collection: 'foo',
            from: fspath.join(
                __dirname,
                '..', 'fixtures', 'restore-collection', 'foo.bson'
            )
        });
        
        var documents = await findInCollection({
            dbHandle,
            collection: 'foo'
        })
        
        expect(documents)
            .to.be.an('array')
            .with.length(2);
        
    });

    it('creates empty collection when bson file is empty', async () => {
        await restore({
            con: serverConnection,
            database: dbName,
            collection: 'empty',
            from: fspath.join(
                __dirname,
                '..', 'fixtures', 'restore-collection', 'empty.bson'
            )
        });
        
        var createdCollections = await (
            dbHandle
            .listCollections()
            .toArray()
        );

        expect(createdCollections)
            .to.be.an('array')
            .with.length(1);

        expect(createdCollections[0].name).to.equal('empty');
        expect(createdCollections[0].type).to.equal('collection');

        var documents = await findInCollection({
            dbHandle,
            collection: 'empty'
        })
        
        expect(documents)
            .to.be.an('array')
            .with.length(0);
        
    })
});
