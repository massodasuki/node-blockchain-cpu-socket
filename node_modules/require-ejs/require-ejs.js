var fs = require('fs');


var path = require('path');

var ejs = require(path.resolve(path.join(__dirname, 'lib', 'ejs')));

require.extensions['.ejs'] = function (module) {
    var filename = module.filename;
    var options = { filename: filename, client: true, compileDebug: true };
    var template = fs.readFileSync(filename).toString().replace(/^\uFEFF/, '');
    var fn = ejs.compile(template, options);
    module._compile('module.exports = ' + fn.source + ';', filename);
};