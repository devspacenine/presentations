var participants = {},
nunjucks = require('nunjucks'),
fs = require('fs'),
path = require('path'),
async = require('async'),
env = app.get('nunjucksEnv'),
redisClient = app.get('redisClient');

module.exports = function(io) {
    io.sockets.on('connection', function(socket) {
        var hs = socket.handshake;

        socket.on('connect as admin', function(user) {
            // Setup an admin socket
            require('./admin-io')(io, socket, JSON.parse(user));
        });

        socket.on('connect as participant', function(user){
            // Make sure there is an active presentation
            require('./participant-io')(io, socket, JSON.parse(user));
            console.log('New participant connected from ' + hs.address.address);
        });

        //Leave init queue
        socket.on('leave room', function(room) {
            socket.leave(room);
        });

        socket.on('chunk height', function(height) {
            socket.set('chunkHeight', height, function(){});
        });

        socket.on('chunk width', function(width) {
            socket.set('chunkWidth', width, function(){});
        }); 

        // Handle disconnect
        socket.on('disconnect', function () {
            console.log('disconnected!');
        });
    });
};
