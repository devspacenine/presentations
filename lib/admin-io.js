var fs = require('fs'),
path = require('path'),
async = require('async'),
env = app.get('nunjucksEnv'),
redisClient = app.get('redisClient');

module.exports = function(io, socket, user) {
    /***************************************************************************
    * Join the admin room
    ***************************************************************************/
    socket.join('admin');

    /***************************************************************************
    * Store the admin id for easy reference
    ***************************************************************************/
    redisClient.set('admin id', socket.id);

    /***************************************************************************
    * Turn on the presentation by adding it's name to the redis store
    ***************************************************************************/
    redisClient.set('presentation', 'Interactive Web Design');

    /***************************************************************************
    * Reset the state of the presentation
    ***************************************************************************/
    redisClient.hmset('state', {
        chunk: 'chunk:chunks/welcome.html'
    });

    /***************************************************************************
    * Set the user for the socket and initiate admin screen
    ***************************************************************************/
    user.socket = socket.id;
    socket.set('user', JSON.stringify(user), function(){
        socket.emit('chunk', {html: env.getTemplate('chunks/admin.html').render({})});
    });  

    /***************************************************************************
    * Set up slide options
    ***************************************************************************/
    var slides_path = path.join(app.get('paths').chunks, 'slides'),
    all_slides;
    fs.readdir(slides_path, function(err, files){
        if(err) {
            console.log(err.stack);
            socket.emit('error', err);
            return;
        }
        async.filter(files, function(file, done){
            fs.stat(path.join(slides_path, file), function(err, stats){
                if(err) {
                    console.log(err.stack);
                    done(false);
                    return;
                }
                if(stats.isFile() && path.extname(file) === '.html') {
                    done(true);
                }else{
                    done(false);
                }
            });
        }, function(results){
            async.map(results, function(file, done){
                done(null, {
                    id: 'slide-'+results.indexOf(file),
                    path: 'chunks/slides/' + file,
                    name: path.basename(file, '.html').titleize(),
                    action: 'push slide'
                });
            }, function(err, slides){
                if(err) {
                    console.log(err.stack);
                    socket.emit('error', err);
                    return;
                }
                // Populate slide collection
                all_slides = slides;
                // Update slide options on the top
                socket.emit('update options', {menu: 'top', title: 'Slides',
                    options: slides
                });
            });
        });
    });

    /***************************************************************************
    * Set up example options
    ***************************************************************************/
    var example_groups_path = path.join(app.get('paths').chunks, 'examples'),
    example_groups = [];
    fs.readdir(example_groups_path, function(err, files){
        if(err) {
            console.log(err.stack);
            socket.emit('error', err);
            return;
        }
        async.filter(files, function(file, done){
            fs.stat(path.join(example_groups_path, file), function(err, stats){
                if(err) {
                    console.log(err.stack);
                    done(false);
                    return;
                }
                if(stats.isDirectory()) {
                    done(true);
                }else{
                    done(false);
                }
            });
        }, function(results){
            // Left examples
            async.map(results, function(file, done){
                // Popuplate group collection
                example_groups.push('chunks/examples/' + file);
                done(null, {
                    id: 'examples-'+results.indexOf(file),
                    path: 'chunks/examples/' + file,
                    name: file.titleize(),
                    action: 'push left examples'
                });
            }, function(err, left_examples){
                if(err) {
                    console.log(err.stack);
                    socket.emit('error', err);
                    return;
                }
                examples_list = left_examples;
                // Update example options on the left
                socket.emit('update options', {menu: 'left', title: 'Examples',
                    options: left_examples
                });
            });

            // Right examples
            async.map(results, function(file, done){
                done(null, {
                    id: 'examples-'+results.indexOf(file),
                    path: 'chunks/examples/' + file,
                    name: file.titleize(),
                    action: 'push right examples'
                });
            }, function(err, right_examples){
                if(err) {
                    console.log(err.stack);
                    socket.emit('error', err);
                    return;
                }
                // Update example options on the right
                socket.emit('update options', {menu: 'right', title: 'Examples',
                    options: right_examples
                });
            });
        });
    });

    /***************************************************************************
    * Push a slide to participants
    ***************************************************************************/
    socket.on('push slide', function(template_path) {
        // Update the presentation chunk state
        redisClient.hset('state', 'chunk', 'chunk:' + template_path);

        // Push slide template path
        io.sockets.in('participants').emit('slide', template_path);
    });

    /***************************************************************************
    * Push examples to participants
    ***************************************************************************/
    socket.on('push left examples', function(data) {
        var examples_path = path.join(app.get('paths').views, data.path),
        init_socket = data.initRequest || null;
        fs.readdir(examples_path, function(err, files){
            if(err) {
                console.log(err.stack);
                socket.emit('error', err);
                return;
            }
            async.filter(files, function(file, done){
                fs.stat(path.join(examples_path, file), function(err, stats){
                    if(err) {
                        console.log(err.stack);
                        done(false);
                        return;
                    }
                    if(stats.isFile() && path.extname(file) === '.html') {
                        done(true);
                    }else{
                        done(false);
                    }
                });
            }, function(results){
                async.map(results.sort(), function(file, done){
                    done(null, {
                        id: 'example-'+results.indexOf(file),
                        path: data.path + '/' + file,
                        name: path.basename(file, '.html').titleize(),
                        action: 'request chunk'
                    });
                }, function(err, examples){
                    if(err) {
                        console.log(err.stack);
                        socket.emit('error', err);
                        return;
                    }
                    // Check if this is an initialization request
                    if(init_socket !== null) {
                        io.sockets.socket(init_socket).emit('update options', {menu: 'left',
                            title: path.basename(data.path).titleize(),
                            options: examples
                        });
                    }else{
                        // Update the presentation state
                        redisClient.hset('state', 'left', 'examples:' + data.path);
                        // Update slide options on the top
                        io.sockets.in('participants').emit('update options', {menu: 'left',
                            title: path.basename(data.path).titleize(),
                            options: examples
                        });
                    }
                });
            });
        });
    });

    /***************************************************************************
    * Push examples to participants
    ***************************************************************************/
    var example_groups;
    socket.on('push right examples', function(data) {
        var examples_path = path.join(app.get('paths').views, data.path),
        init_socket = data.init_socket || null;
        fs.readdir(examples_path, function(err, files){
            if(err) {
                console.log(err.stack);
                socket.emit('error', err);
                return;
            }
            async.filter(files, function(file, done){
                fs.stat(path.join(examples_path, file), function(err, stats){
                    if(err) {
                        console.log(err.stack);
                        done(false);
                        return;
                    }
                    if(stats.isFile() && path.extname(file) === '.html') {
                        done(true);
                    }else{
                        done(false);
                    }
                });
            }, function(results){
                async.map(results.sort(), function(file, done){
                    done(null, {
                        id: 'example-'+results.indexOf(file),
                        path: data.path + '/' + file,
                        name: path.basename(file, '.html').titleize(),
                        action: 'request chunk'
                    });
                }, function(err, examples){
                    if(err) {
                        console.log(err.stack);
                        socket.emit('error', err);
                        return;
                    }
                    // Check if this is an initialization request
                    if(init_socket !== null) {
                        io.sockets.socket(init_socket).emit('update options', {menu: 'right',
                            title: path.basename(data.path).titleize(),
                            options: examples
                        });
                    }else{
                        // Update the presentation state
                        redisClient.hset('state', 'right', 'examples:' + data.path);
                        // Update slide options on the top
                        io.sockets.in('participants').emit('update options', {menu: 'right',
                            title: path.basename(data.path).titleize(),
                            options: examples
                        });
                    }
                });
            });
        });
    });

    /***************************************************************************
    * get examples for admin user chunk
    ***************************************************************************/
    socket.on('expand user examples', function(data) {
        example_groups.each(function(examples_path){
            full_path = path.join(app.get('paths').views, examples_path);
            fs.readdir(full_path, function(err, files){
                if(err) {
                    console.log(err.stack);
                    socket.emit('error', err);
                    return;
                }
                async.filter(files, function(file, done){
                    fs.stat(path.join(full_path, file), function(err, stats){
                        if(err) {
                            console.log(err.stack);
                            done(false);
                            return;
                        }
                        if(stats.isFile() && path.extname(file) === '.html') {
                            done(true);
                        }else{
                            done(false);
                        }
                    });
                }, function(results){
                    async.map(results.sort(), function(file, done){
                        done(null, {
                            id: 'example-'+results.indexOf(file),
                            path: examples_path + '/' + file,
                            name: path.basename(file, '.html').titleize(),
                            action: 'push to user'
                        });
                    }, function(err, examples){
                        if(err) {
                            console.log(err.stack);
                            socket.emit('error', err);
                            return;
                        }
                        socket.emit('add user examples', {socket: data.socket,
                            title: path.basename(examples_path).titleize(),
                            options: examples
                        });
                    });
                });
            });
        });
    });

    /***************************************************************************
    * Get user chunk for participant
    ***************************************************************************/
    socket.on('user chunk', function(data){
        io.sockets.socket(data.socket).get('user', function(err, user){
            socket.emit('chunk', {html: env.getTemplate(data.path).render({user: JSON.parse(user), userJSON: user})});
        });
    });

    /***************************************************************************
    * Kick participant
    ***************************************************************************/
    socket.on('kick', function(data){
    });

    /***************************************************************************
    * Clear options
    ***************************************************************************/
    socket.on('clear options', function(){
        redisClient.hdel('state', 'left');
        redisClient.hdel('state', 'right');
        io.sockets.in('participants').emit('update options', {clear: true});
    });

    /***************************************************************************
    * Disable click bang
    ***************************************************************************/
    socket.on('disable click bang', function(){
        io.sockets.in('participants').emit('disable click bang');
    });

    /***************************************************************************
    * Enable click bang
    ***************************************************************************/
    socket.on('enable click bang', function(){
        io.sockets.in('participants').emit('enable click bang');
    });

    /***************************************************************************
    * Reset presentation to welcome screen
    ***************************************************************************/
    socket.on('reset', function(){
        /***************************************************************************
        * Reset the state of the presentation
        ***************************************************************************/
        redisClient.del('state', function(){
            redisClient.hmset('state', {
                chunk: 'chunk:chunks/welcome.html'
            });
        });
        io.sockets.in('participants').emit('update options', {reset: true});
        io.sockets.in('participants').emit('enable click bang');
    });

    /***************************************************************************
    * Close the presentation
    ***************************************************************************/
    socket.on('close', function(){
        io.sockets.clients('admin').each(function(id, i){
            io.sockets.socket(id).disconnect();
        });
    });

    /***************************************************************************
    * Close presentation when the admin leaves
    ***************************************************************************/
    socket.on('disconnect', function(){
        console.log('Closing presentation');

        // Clear the redis store
        redisClient.del('admin id');
        redisClient.del('presentation');
        redisClient.del('state');

        // Disconnect all participants
        io.sockets.clients('participants').each(function(id, i){
            io.sockets.socket(id).disconnect();
        });
    });
}
