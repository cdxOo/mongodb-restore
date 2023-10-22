2.0.0 / 2023-10-22
==================

  * BREAKING: mongodb is now peer dependency
  * BREAKING: updated mongodb driver version to 4.x
  * BREAKING: required node version is now >= 14
  * BREAKING: CollectionExists error was replaced with CollectionsExist
  * FEATURE: can now restore bson buffers directly
  * FEATURE: can now transform documents while restoring
  * FIX: when restoring multiple collections we check if none of the
    collections before restoring anything


1.2.0 / 2023-10-20
==================

  * fixtures dir is now ignored on pack; reducing published package size
  * updated mongodb driver version to 3.7.4 and bson version to 4.7.2
