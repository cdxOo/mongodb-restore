'use strict';
var { expect } = require('chai');
var fspath = require('path');
var { ObjectId } = require('mongodb');

var {
    initTestEnv,
    findInCollection,
    ejson,
} = require('./test-helpers');

var restore = require('./restore-dump');
var errors = require('./errors');


describe('restore-dump', () => {
    
    var dump = 'dump-1',
        server, uri, serverConnection;
    beforeEach(async () => {
        ({
            server,
            uri,
            serverConnection
        } = await initTestEnv());
    });

    afterEach(async () => {
        if (serverConnection) {
            serverConnection.close();
        }
        await server.stop();
    });
    
    describe('core behavior', () => {
        it('restores fixtures to multiple databases', async () => {
            await restore({
                uri,
                from: fspath.join(
                    __dirname,
                    '..', 'fixtures', 'restore-dump', dump
                )
            });
            
            var db1 = serverConnection.db('db-1');

            var foo = await findInCollection({
                dbHandle: db1,
                collection: 'foo',
            });

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
                dbHandle: db1,
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

            var db2 = serverConnection.db('db-2');

            var alice = await findInCollection({
                dbHandle: db2,
                collection: 'alice',
            });

            expect(ejson(alice)).to.eql(ejson([
                {
                    _id: ObjectId('5e86b7f093ebfbc68650f90a'),
                    myprop: 'alice',
                },
            ]))
        });
    })

    describe('overwrite behavior', () => {
       
        it('throws on existing collection by default', async () => {
            await (
                serverConnection
                .db('db-1')
                .collection('foo')
                .insertOne({ myprop: 'exists' })
            );
         
            var error = undefined;
            try {
                await restore({
                    uri,
                    from: fspath.join(
                        __dirname,
                        '..', 'fixtures', 'restore-dump', dump
                    )
                });
            }
            catch (e) {
                error = e;
            }
            
            expect(error).to.exist;
            expect(error).to.be.instanceOf(errors.CollectionsExist);
            expect(error.collections).to.eql([
                'foo' // FIXME: should include db name?
            ])
        });

        it('proceeds normally when "overwrite" is set', async () => {
            await (
                serverConnection
                .db('db-1')
                .collection('foo')
                .insertOne({ myprop: 'exists' })
            );

            await restore({
                uri,
                from: fspath.join(
                    __dirname,
                    '..', 'fixtures', 'restore-dump', dump
                ),
                onCollectionExists: 'overwrite',
            });
        });

    })
    
    describe('transform documents', () => {
        it('can perform transformed restore', async () => {
            var transformDocuments = (doc, { collection, database }) => ({
                ...doc,
                baz: `${database}.${collection} => bazed ${doc.myprop}`
            });
            
            await restore({
                uri,
                from: fspath.join(
                    __dirname,
                    '..', 'fixtures', 'restore-dump', dump
                ),
                transformDocuments
            });

            var db1 = serverConnection.db('db-1');

            var foo = await findInCollection({
                dbHandle: db1,
                collection: 'foo',
            });

            expect(ejson(foo)).to.eql(ejson([
                {
                    _id: ObjectId('5e8621d8e0dddbe18c80492d'),
                    myprop: 'one',
                    baz: 'db-1.foo => bazed one'
                },
                {
                    _id: ObjectId('5e8621ede0dddbe18c80492e'),
                    myprop: 'two',
                    baz: 'db-1.foo => bazed two'
                }
            ]))

            var bar = await findInCollection({
                dbHandle: db1,
                collection: 'bar',
            });

            expect(ejson(bar)).to.eql(ejson([
                {
                    _id: ObjectId('5e86396fb2953ac1cc5dc524'),
                    myprop: 'three',
                    baz: 'db-1.bar => bazed three'
                },
                {
                    _id: ObjectId('5e86396fb2953ac1cc5dc525'),
                    myprop: 'four',
                    baz: 'db-1.bar => bazed four'
                }
            ]))

            var db2 = serverConnection.db('db-2');

            var alice = await findInCollection({
                dbHandle: db2,
                collection: 'alice',
            });

            expect(ejson(alice)).to.eql(ejson([
                {
                    _id: ObjectId('5e86b7f093ebfbc68650f90a'),
                    myprop: 'alice',
                    baz: 'db-2.alice => bazed alice'
                },
            ]))

        });
    })
});
