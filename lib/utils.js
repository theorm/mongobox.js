var fs = require("fs");
var path = require("path");

/*
  Remove directory recursively.
  Thanks to https://gist.github.com/tkihira/2367067
*/
var rmdirSync = function(dir) {
  var list = fs.readdirSync(dir);
  for(var i = 0; i < list.length; i++) {
    var filename = path.join(dir, list[i]);
    var stat = fs.statSync(filename);

    if(filename == "." || filename == "..") {
      // pass these files
    } else if(stat.isDirectory()) {
      // rmdir recursively
      rmdirSync(filename);
    } else {
      // rm fiilename
      fs.unlinkSync(filename);
    }
  }
  fs.rmdirSync(dir);
};

module.exports.rmdirSync = rmdirSync;