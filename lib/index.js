const child_process = require('child_process')
const fs = require('fs')
const net = require('net')
const {tmpdir} = require('os')
const {join} = require('path')
const {format} = require('util')

const freeport = require('freeport')
const _ = require('lodash')

const utils = require('./utils');


var MONGOD_BIN = 'mongod';
var DEFAULT_ARGS = [
  // journaling on by default in 2.0 and makes it to slow
  // for tests, can causes failures in jenkins
  "--nojournal",
  // disable unused.
  "--nounixsocket",
  // don't flood stdout, we're not reading it
  "--quiet",
  // use a smaller default file size
  "--smallfiles",
]
var START_CHECK_ATTEMPTS = 200;


function MongoBox(_options) {
  var options = _options || {};
  this.options = options;

  this.options.mongodBinary = options.mongodBinary || MONGOD_BIN;

  if (!this.options.mongodBinary)
    throw new Error(format('Could not find %s in system PATH. Make sure you have mongod installed.', MONGOD_BIN));

  if (fs.existsSync(this.options.databasePath)
    && !fs.statSync(this.options.databasePath).isDirectory()) {
    throw new Error('Database path should be a directory.')
  }

  var self = this;
  process.on('exit', function(code) {
    self.stop();
  });
}


MongoBox.prototype.start = function(callback) {
  if (this.options.databasePath) {
    if (!fs.existsSync(this.options.databasePath)) {
      fs.mkdirSync(this.options.databasePath);
    }
  } else {
    this._temporary = fs.mkdtempSync(join(tmpdir(), 'mongobox-'));
    this.options.databasePath = this._temporary;
  }

  var self = this;
  if (!this.options.port) {
    freeport(function(err, port) {
      if (err) return callback(err);
      self.options.port = port;
      doStart.bind(self)();
    });
  } else {
    doStart.call(this);
  }

  function doStart() {
    var args = _.clone(DEFAULT_ARGS);
    var op

    args = args.concat(['--dbpath', this.options.databasePath]);
    args = args.concat(['--port', this.options.port]);

    if (this.options.logPath)
      args = args.concat(['--logpath', this.options.logPath]);

    if (this.options.auth)
      args.push("--auth");

    if (!this.options.scripting)
      args.push("--noscripting");

    if (!this.options.prealloc)
      args.push("--noprealloc");


    this.process = child_process.spawn(this.options.mongodBinary, args);

    if (this.options.printCommand)
      console.log("%s %s", this.options.mongodBinary, args.join(" "));

    var self = this;
    this.process.on('close', function(code) {
      self.process = undefined;
      utils.rmdirSync(self.options.databasePath);
      if (self._temporary) {
        self._temporary = undefined;
        self.options.databasePath = undefined;
      }

      if (self._onStopped) self._onStopped(null, code);
    });

    this.process.on('error', function(e) {
      console.error(e);
      self.stop();
    });

    return this._waitTillStarted(callback);
  }
}

MongoBox.prototype.stop = function(callback) {
  if (!this.process) return callback ? callback() : _.noop();

  this._onStopped = callback;
  this.process.kill();
}

MongoBox.prototype.isRunning = function() {
  return this.process !== undefined;
}

MongoBox.prototype.getPort = function() {
  return this.options.port;
}

MongoBox.prototype._waitTillStarted = function(callback) {
  var attempts = 0;
  var self = this;

  function tryConnect() {
    net.connect({port: self.options.port}, callback)
    .on('error', function() {
      attempts += 1;
      if (self.process && attempts < START_CHECK_ATTEMPTS)
        return setTimeout(tryConnect, 250);

      callback(new Error('MongoDB did not start.'))
    });
  }

  tryConnect();
}

MongoBox.MongoBox = MongoBox;
module.exports = MongoBox;
