var MongoBox = require('../index').MongoBox;

var box = new MongoBox();
var timeout = 3; // sec

box.start(function(e) {
  if (e) return console.log('could not start: %s', e);
  console.log('started. Stopping in %s sec.', timeout);

  setTimeout(function() {
    box.stop(function(err, code) {
      if (err) return console.err('could not stop: %s', err);
      console.log('stopped: %s', code);
    });
  }, timeout * 1000);
});
