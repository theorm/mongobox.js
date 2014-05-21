# mongobox.js

Start and stop a sandboxed instance of MongoDB from within a node.js application. Extremely useful for unit tests and no mocks of database required. The sandboxed MongoDB instance will run on a free port alongside other instances and will create files in a temporary directory that will be removed after the process exits.

```js
var MongoBox = require('mongobox').MongoBox;

var options = {};
var mongobox = new MongoBox(options);

mongobox.start(function(err) {
    if (err) return console.error('Could not start the database: %s', err);
    mongobox.stop(function(err, code) {
        if (err) return console.error('Could not stop: %s',err);
        console.log('Stopped with code %s', code);
    });
});
```


## Constructor options are:
 * `databasePath` - temporary path for the database files. Will be created if it does not exist. By default a random temporary directory will be created.
 * `mongodBinary` - location of the `mongod` binary. By default the one from system `PATH` is used.
 * `port` - port to use. By default a random free port will be chosen.
 * `auth` - `mongod`'s `--auth` command line value.
 * `scripting` - removes `mongod`'s `--noscripting` enabled by default.
 * `prealloc` - removes `mongod`'s `--noprealloc` enabled by default.

```js
var mongobox = new MongoBox({port:1337, databasePath: '/tmp/foobar'});
```

