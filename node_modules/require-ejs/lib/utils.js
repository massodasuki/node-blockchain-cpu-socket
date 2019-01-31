var fs = require('fs');
var path = require('path');

exports.read = function (filename) {
    var content = fs.readFileSync(filename, 'utf8').toString().replace(/^\uFEFF/, '');
    return content;
};

exports.escape = function (html) {
    return String(html)
      .replace(/&(?!\w+;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
};


exports.resolvePath = function (name, filename) {
    var filepath = path.join(path.dirname(filename), name);
    var ext = path.extname(name);
    if (!ext) filepath += '.ejs';
    return filepath;
};
