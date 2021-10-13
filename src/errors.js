class RestoreError extends Error {};

class CollectionExists extends RestoreError {
    constructor ({ collection } = {}) {
        super(
            `collection "${collection}" already exists;` +
            ` set onCollectionExists to "overwrite" to remove this error`
        );
        this.name = 'RestoreError.CollectionExists';
    }
}

module.exports = {
    RestoreError,
    CollectionExists
}
