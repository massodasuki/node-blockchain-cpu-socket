// based on a fork of ejs - https://github.com/visionmedia/ejs
var path = require('path'),
    utils = require(path.join(__dirname, 'utils')),
    read = utils.read,
    resolveInclude = utils.resolvePath,
    filters = exports.filters = require(path.join(__dirname, 'filters'));

exports.utils = utils;

/**
 * Translate filtered code into function calls.
 *
 * @param {String} js
 * @return {String}
 * @api private
 */

function filtered(js) {
    return js.substr(1).split('|').reduce(function(js, filter) {
        var parts = filter.split(':'),
            name = parts.shift(),
            args = parts.shift() || '';
        if (args) args = ', ' + args;
        return 'filters.' + name + '(' + js + args + ')';
    });
}

/**
 * Re-throw the given `err` in context to the
 * `str` of ejs, `filename`, and `lineno`.
 *
 * @param {Error} err
 * @param {String} str
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

function rethrow(err, str, filename, lineno) {
    var lines = str.split('\n'),
        start = Math.max(lineno - 3, 0),
        end = Math.min(lines.length, lineno + 3);

    // Error context
    var context = lines.slice(start, end).map(function(line, i) {
        var curr = i + start + 1;
        return (curr == lineno ? ' >> ' : '    ') + curr + '| ' + line;
    }).join('\n');

    // Alter exception message
    err.path = filename;
    err.message = (filename || 'ejs') + ':' + lineno + '\n' + context + '\n\n' + err.message;

    throw err;
}

/**
 * Parse the given `str` of ejs, returning the function body.
 *
 * @param {String} str
 * @return {String}
 * @api public
 */
var parse = exports.parse = function(str, options) {
    options = options || {}, open = options.open || exports.open || '<%';
    var close = options.close || exports.close || '%>',
        filename = options.filename,
        compileDebug = options.compileDebug !== false,
        buf = [];

    buf.push('var buf = [];');
    if (false !== options._with) buf.push('\nwith (locals || {}) { (function(){ ');
    buf.push('\n buf.push(\'');

    var lineno = 1;

    var consumeEOL = false;
    for (var i = 0, len = str.length; i < len; ++i) {
        if (str.slice(i, open.length + i) == open) {
            i += open.length;

            var prefix, postfix, line = (compileDebug ? '__stack.lineno=' : '') + lineno;
            switch (str.substr(i, 1)) {
                case '=':
                    prefix = "', escape((" + line + ', ';
                    postfix = ")), '";
                    ++i;
                    break;
                case '-':
                    prefix = "', (" + line + ', ';
                    postfix = "), '";
                    ++i;
                    break;
                default:
                    prefix = "');" + line + ';';
                    postfix = "; buf.push('";
            }

            var end = str.indexOf(close, i),
                js = str.substring(i, end),
                start = i,
                include = null,
                n = 0;

            if ('-' == js[js.length - 1]) {
                js = js.substring(0, js.length - 2);
                consumeEOL = true;
            }

            if (js.trim().indexOf('include') === 0) {
                var name = js.trim().slice(7).trim();
                if (!filename) throw new Error('filename option is required for includes');
                var path = resolveInclude(name, filename);
                include = read(path);
                include = exports.parse(include, {
                    filename: path,
                    _with: false,
                    open: open,
                    close: close,
                    compileDebug: compileDebug
                });
                buf.push("' + (function(){" + include + "})() + '");
                js = '';
            }

            while (~(n = js.indexOf("\n", n))) n++, lineno++;
            if (js.substr(0, 1) == ':') js = filtered(js);
            if (js) {
                if (js.lastIndexOf('//') > js.lastIndexOf('\n')) js += '\n';
                buf.push(prefix, js, postfix);
            }
            i += end - start + close.length - 1;

        } else if (str.substr(i, 1) == "\\") {
            buf.push("\\\\");
        } else if (str.substr(i, 1) == "'") {
            buf.push("\\'");
        } else if (str.substr(i, 1) == "\r") {
            // ignore
        } else if (str.substr(i, 1) == "\n") {
            if (consumeEOL) {
                consumeEOL = false;
            } else {
                buf.push("\\n");
                lineno++;
            }
        } else {
            buf.push(str.substr(i, 1));
        }
    }

    // if (false !== options._with) buf.push("'); })();\n} \nreturn buf.join('').replace(/\\r/g, '').split('\\n').filter(function (line) {\n\treturn line.trim();\n}).join('\\n');");
    if (false !== options._with) buf.push("'); })();\n} \nreturn buf.join('');");
    else buf.push("');\nreturn buf.join('');");

    return buf.join('');

};

/**
 * Compile the given `str` of ejs into a `Function`.
 *
 * @param {String} str
 * @param {Object} options
 * @return {Function}
 * @api public
 */
var compile = exports.compile = function(str, options) {
    options = options || {};
    var escape = options.escape || utils.escape;

    var input = JSON.stringify(str),
        compileDebug = options.compileDebug !== false,
        filename = options.filename ? JSON.stringify(options.filename) : 'undefined';

    if (compileDebug) {
        // Adds the fancy stack trace meta info
        str = [
            'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',
            rethrow.toString(),
            'try {',
            exports.parse(str, options),
            '} catch (err) {',
            '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',
            '}'
        ].join("\n");
    } else {
        str = exports.parse(str, options);
    }

    str = 'escape = escape || ' + escape.toString() + ';\n' + str;
    var fn;
    try {
        fn = new Function('locals, filters, escape', str);
    } catch (err) {
        if ('SyntaxError' == err.name) {
            err.message += options.filename ? ' in ' + filename : ' while compiling ejs';
        }
        throw err;
    }

    fn.source = fn.toString();

    return fn;

};