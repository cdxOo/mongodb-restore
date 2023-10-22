class RestoreError extends Error {};

class CollectionsExist extends RestoreError {
    constructor ({ collections } = {}) {
        super(
            `collections [ ${collections.join(',')} ] already exist;` +
            ` set onCollectionExists to "overwrite" to remove this error`
        );
        this.name = 'RestoreError.CollectionsExist';
        this.collections = collections;
    }
}

module.exports = {
    RestoreError,
    CollectionsExist
}
