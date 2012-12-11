var env = app.get('nunjucksEnv'),
redisClient = app.get('redisClient');

module.exports = function(io, socket, user) {
    function init(socket, user) {
        redisClient.hgetall('state', function(err, state){
            if(err) {
                console.log(err.stack);
                socket.emit('error', err);
                return;
            }

            // Initialize the chunk
            console.log(state);
            socket.emit('chunk', {html: env.getTemplate(state.chunk.split(':')[1]).render({user: user, userJSON: JSON.stringify(user)})}); 

            // Get the admin socket to initialize the menus of this participant if necessary
            if(Object.has(state, 'left') || Object.has(state, 'right')) {
                // Request initialization from admin
                redisClient.get('admin id', function(err, adminId){
                    if(err) {
                        console.log(err.stack);
                        socket.emit('error', err);
                        return;
                    }
                    if(Object.has(state, 'left')) {
                        io.sockets.socket(adminId).emit('push left examples', {path: state.left.split(':')[1], init_socket: socket.id});
                    }
                    if(Object.has(state, 'right')) {
                        io.sockets.socket(adminId).emit('push right examples', {path: state.right.split(':')[1], init_socket: socket.id});
                    }
                    // Join the participants room
                    socket.join('participants');

                    // Enable click bang?
                    if(state.chunk.split(':')[1] === 'chunks/welcome.html') {
                        io.sockets.in('participants').emit('enable click bang');
                    }

                    // Announce new participant
                    io.sockets.in('admin').emit('new participant', user);

                    // Announce disconnect
                    socket.on('disconnect', function(){
                        io.sockets.in('admin').emit('participant disconnect', user);
                    });
                });
            }else{
                // Join the participants room if there are no menus to initialize
                socket.join('participants');

                // Enable click bang?
                if(state.chunk.split(':')[1] === 'chunks/welcome.html') {
                    io.sockets.in('participants').emit('enable click bang');
                }

                // Announce new participant
                io.sockets.in('admin').emit('new participant', user);

                // Announce disconnect
                socket.on('disconnect', function(){
                    io.sockets.in('admin').emit('participant disconnect', user);
                });
            }
        });
    }

    user.socket = socket.id;
    socket.set('user', JSON.stringify(user), function(){
        if(!user.ready) {
            socket.emit('chunk', {html: env.getTemplate('chunks/get-name.html').render({user: user, userJSON: JSON.stringify(user)})});
        }else{
            init(socket, user); 
        }
    });

    // Initialize the presentation interface
    socket.on('init', function(user){
        console.log('got here');
        
    });

    // Listen for form submittions
    socket.on('post', function(data) {
        data = JSON.parse(data);
        switch(data.form) {
            case 'shout':
                socket.get('user', function(err, user){
                    if(err) {
                        console.log(err.stack);
                        socket.emit('error', err);
                        return;
                    }
                    io.sockets.in('participants').emit('shout', {msg: data.values.msg, name: JSON.parse(user).name});
                });
                break;
            case 'get-name':
                socket.get('user', function(err, user){
                    if(err) {
                        console.log(err.stack);
                        socket.emit('error', err);
                        return;
                    }
                    user = JSON.parse(user);
                    user.name = data.values.name;
                    user.ready = true;
                    socket.set('user', JSON.stringify(user), function(){
                        init(socket, user);
                    });
                });
            default:
                break;
        }
    });

    // Broadcast click bang
    socket.on('click bang', function(pos){
        io.sockets.in('participants').emit('click bang', pos);
    });

    // Get chunk
    socket.on('request chunk', function(path, fn) {
        // Get user before rendering template
        socket.get('user', function(err, user){
            if(err) {
                console.log(err.stack);
                return;
            }
            socket.emit('chunk', {html: env.getTemplate(path).render({user: JSON.parse(user), userJSON: user})});
        });
    });
}
