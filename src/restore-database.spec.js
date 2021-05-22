'use strict';
var expect = require('chai').expect,
    fspath = require('path'),
    { ObjectId } = require('mongodb');

var restore = require('./restore-database');

var {
    initTestEnv,
    findInCollection,
    ejson,
} = require('./test-helpers');

describe('restore-database', () => {
    
    var server, uri, dbName, serverConnection, dbHandle;
    beforeEach(async () => {
        ({
            server,
            uri,
            dbName,

            serverConnection,
            dbHandle,
        } = await initTestEnv({ instance: { dbName: 'db-1' }}))
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
        
        var foo = await findInCollection({
            dbHandle,
            collection: 'foo'
        })
        
        expect(ejson(foo)).to.eql(ejson([
            {
                _id: ObjectId('5e8621d8e0dddbe18c80492d'),
                myprop: 'one',
            },
            {
                _id: ObjectId('5e8621ede0dddbe18c80492e'),
                myprop: 'two',
            }
        ]))

        var bar = await findInCollection({
            dbHandle,
            collection: 'bar',
        });

        expect(ejson(bar)).to.eql(ejson([
            {
                _id: ObjectId('5e86396fb2953ac1cc5dc524'),
                myprop: 'three',
            },
            {
                _id: ObjectId('5e86396fb2953ac1cc5dc525'),
                myprop: 'four',
            }
        ]))

    });

});
