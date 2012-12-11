/* Dependencies */
var events = require('events'),
express = require('express'),
sugar = require('sugar');

/*
process.on('uncaughtException', function(err) {
    console.log(err.stack);
    throw err;
});
*/

global.app = express();
app.set('root', __dirname);

// set other globals
require('./lib/globals');

require('./lib/setup').setup({
    mongoose: require('mongoose'),
    mongodb: require('mongodb'),
    ie_regex: new RegExp("^msie.*", "gi"),
    today: new Date()
});
