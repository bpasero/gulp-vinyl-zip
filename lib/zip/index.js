'use strict';

var through = require('through2');
var yazl = require('yazl');
var File = require('../vinyl-zip');

function zip(zipPath) {
  if (!zipPath) throw new Error('No zip path specified.');

  var zip = new yazl.ZipFile();
  var output = through.obj();

  var stream = through.obj(function(file, enc, cb) {
    var stat = file.stat || {};

    var opts = {
      mtime: stat.mtime,
      mode: stat.mode
    };

    var path = file.relative.replace(/\\/g, '/');

    if (stat.isSymbolicLink && stat.isSymbolicLink()) {
      zip.addBuffer(new Buffer(file.symlink), path, opts);
    } else if (file.isDirectory()) {
      // In Windows, directories have a 666 permissions. This doesn't go well
      // on OS X and Linux, where directories are expected to be 755.
      if (/win32/.test(process.platform)) {
        opts.mode = 16877;
      }
      
      zip.addEmptyDirectory(path, opts);
    } else if (file.isBuffer()) {
      zip.addBuffer(file.contents, path, opts);
    } else if (file.isStream()) {
      zip.addReadStream(file.contents, path, opts);
    }

    cb();
  }, function(cb) {
    stream.push(new File({path: zipPath, contents: zip.outputStream}));
    zip.end(function(size) {
      cb();
    });
  });

  stream.resume();
  return stream;
}

module.exports = zip;
