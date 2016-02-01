var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

HeeYouProvider = function(host, port) {
  this.db= new Db('heeyou-log', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};


HeeYouProvider.prototype.getCollection= function(callback) {
  this.db.collection('logs', function(error, log_collection) {
    if( error ) callback(error);
    else callback(null, log_collection);
  });
};

//find all logs
HeeYouProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, log_collection) {
      if( error ) callback(error)
      else {
        log_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};

//save new log
HeeYouProvider.prototype.save = function(logs, callback) {
    this.getCollection(function(error, log_collection) {
      if( error ) callback(error)
      else {
        if( typeof(logs.length)=="undefined")
          logs = [logs];

        for( var i =0;i< logs.length;i++ ) {
          log = logs[i];
          log.created_at = new Date();
        }

        log_collection.insert(logs, function() {
          callback(null, logs);
        });
      }
    });
};

exports.HeeYouProvider = HeeYouProvider;