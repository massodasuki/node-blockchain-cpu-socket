require(__dirname + '/../require-ejs');

var assert = require('assert');

var page = require(__dirname + '/views/layout');


assert.throws(function() {
    var result = page({
        title: 'test-page',
        text: 'test page text'
    });
});

var result = page({
        title: 'test-page',
        text: 'test page text',
        items: [{
            text: 'home',
            url: '/index'
        }, {
            text: 'logout',
            url: '/logout'
        }]
    });

var expected = '<b>test-page</b>\n<p>test page text</p>\n\n<ul>\n    <li><a href=\"/index\">home</a></li>\n    <li><a href=\"/logout\">logout</a></li>\n</ul>\n';
assert.equal(result, expected);