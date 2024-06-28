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
var errors = require('./errors');


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

            expect(error).to.exist;
            expect(error).to.be.instanceOf(errors.CollectionsExist);
            expect(error.collections).to.eql([
                'foo' // FIXME: should include db name?
            ])
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
        it('has reasoanble performance for larger collection', async () => {
        
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
            //console.log(e-s);

        }),
        it('has reasoanble performance for larger collection with filter', async () => {
        
            var s = new Date().getTime();
            await restore({
                uri,
                database: dbName,
                collection: 'foo',
                from: fspath.join(
                    __dirname,
                    '..', 'fixtures', 'restore-collection', 'large.bson'
                ),
                filter: (it) => (
                    it.pin.startsWith('18')
                )
            });
            var e = new Date().getTime();
            //console.log(e-s);

        })
    });

    describe('filter documents', () => {
        it('can perform filtered restore', async () => {
            var filterDocuments = (doc) => (
                doc.myprop === 'two'
            );
            
            await restore({
                uri,
                database: dbName,
                collection: 'foo',
                from: fspath.join(
                    __dirname,
                    '..', 'fixtures', 'restore-collection', 'foo.bson'
                ),
                filterDocuments
            });
            
            var documents = await findInCollection({
                dbHandle,
                collection: 'foo'
            })
            
            expect(documents)
                .to.be.an('array')
                .with.length(1);
          
            expect(ejson(documents)).to.eql(ejson([
                {
                    _id: ObjectId('5e8621ede0dddbe18c80492e'),
                    myprop: 'two',
                }
            ]))
        });
    })
    describe('transform documents', () => {
        it('can perform transformed restore', async () => {
            var transformDocuments = (doc) => ({
                ...doc,
                baz: `bazed ${doc.myprop}`
            });
            
            await restore({
                uri,
                database: dbName,
                collection: 'foo',
                from: fspath.join(
                    __dirname,
                    '..', 'fixtures', 'restore-collection', 'foo.bson'
                ),
                transformDocuments
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
                    baz: 'bazed one',
                },
                {
                    _id: ObjectId('5e8621ede0dddbe18c80492e'),
                    myprop: 'two',
                    baz: 'bazed two',
                }
            ]))
        });
    })
});
