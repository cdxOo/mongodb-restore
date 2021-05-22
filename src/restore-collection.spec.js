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
    
    describe('core behavior', () => {
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
    })


    describe('overwrite behavior', () => {

        it('throws on existing collection by default', async () => {
            await dbHandle.collection('foo').insertOne({ myprop: 'exists' });

            var error = undefined;
            try {
                await restore({
                    uri,
                    database: dbName,
                    collection: 'foo',
                    from: fspath.join(
                        __dirname,
                        '..', 'fixtures', 'restore-collection', 'foo.bson'
                    )
                });
            }
            catch (e) {
                error = e;
            }

            // FIXME: this might not be sufficient
            expect(error).to.exist;
        });

        it('proceeds normally when "overwrite" is set', async () => {
            await dbHandle.collection('foo').insertOne({ myprop: 'exists' });
            
            await restore({
                uri,
                database: dbName,
                collection: 'foo',
                from: fspath.join(
                    __dirname,
                    '..', 'fixtures', 'restore-collection', 'foo.bson'
                ),
                onCollectionExists: 'overwrite',
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

    });

    describe('restore performance', () => {
        it ('has reasoanble performance for larger collection', async () => {
        
            var s = new Date().getTime();
            await restore({
                uri,
                database: dbName,
                collection: 'foo',
                from: fspath.join(
                    __dirname,
                    '..', 'fixtures', 'restore-collection', 'large.bson'
                ),
            });
            var e = new Date().getTime();
            console.log(e-s);

        })
    });
});
