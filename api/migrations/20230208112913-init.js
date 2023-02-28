'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async function(db) {
  require('fs').readFile('migrations/init.sql', 'utf8', function(err, data) { if (err) throw err; db.runSql(data); });
  return null;
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
