module.exports.setup = function(opts){
    var mongoose = opts.mongoose,
    mongodb = opts.mongodb,
    mongooseTypes = require('/home/yeluapyeroc/workspace/Node Workspaces/Packages/mongoose-types'),
    redis = require("redis"),
    FormFactory = require('/home/yeluapyeroc/workspace/Node Workspaces/Packages/mongoose-form-factory'),
    express = require('express'),
    RedisStore = require('connect-redis')(express),
    redisClient = redis.createClient(),
    sessionStore = new RedisStore({host: 'localhost', port: 8000, client: redisClient}),
    secret = '599da1fb19997b63d592806ebda45c5cfb6127fc',
    nodemailer = require('nodemailer'),
    nunjucks = require('nunjucks'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    path = require('path'),
    sio = require('socket.io'),
    SocketRedisStore = require('socket.io/lib/stores/redis'),
    SocketPubStore = redis.createClient(),
    SocketSubStore = redis.createClient(),
    SocketClientStore = redis.createClient(),
    http = require('http'),
    flash = require('connect-flash');

    // Catch errors for Redis client
    redisClient.on("error", function(err) {
        console.log("Error" + err);
    });

    // Initialize user set and anonymous user
    redisClient.sadd('users', 'user:0', function(err){console.log(err);});
    redisClient.hmset('user:0', {id: 0, name: 'Anonymous', admin: false, ready: false, sessionId: '0'});

    // Share the client
    app.set('redisClient', redisClient);

    mongooseTypes.loadTypes(mongoose);

    /***************************************************************************
    * Global Paths
    ***************************************************************************/
    app.set('paths' ,{
        views: path.join(app.get('root'), 'app', 'views'),
        static: path.join(app.get('root'), 'static'),
        routes: path.join(app.get('root'), 'app', 'routes'),
        models: path.join(app.get('root'), 'app', 'models'),
        tmp: path.join(app.get('root'), 'tmp'),
        chunks: path.join(app.get('root'), 'app', 'views', 'chunks')
    });

    /***************************************************************************
    * Email Setup
    ***************************************************************************/
/*
app.set('emailTransport', function() {
return nodemailer.createTransport("SMTP", {
host: 'smtp.webfaction.com',
secureConnection: true,
port: 465,
requiresAuth: true,
auth: {
user: 'triviawithfriends',
pass: "]17;8*!=316426O|0aY2q'{722[Ov4"
}
});
});
*/
    
    /***************************************************************************
    * Passport Authentication Setup
    ***************************************************************************/
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    /***************************************************************************
    * Passport Strategy Configuration 
    ***************************************************************************/
    passport.use(new LocalStrategy({usernameField: 'sessionId', passwordField: 'presentation_key'}, function(sessionId, key, done){
        // Make sure the presentation is active
        var presentationKey = app.get('presentationKey'),
        adminKey = app.get('adminKey');
        if(presentationKey && adminKey) {
            if(key === presentationKey) {
                return done(null, {id: 0, name: 'Anonymous', admin: false, presentation_key: key, ready: false, sessionId: sessionId});
            }else{
                if(key === adminKey) {
                    return done(null, {id: 1, name: 'Corey', admin: true, presentation_key: key, ready: true, sessionId: sessionId});
                }else{
                    console.log('Invalid presentation key');
                    return done(null, false, {message: 'Invalid presentation key'});
                }
            }
        }else{
            console.log('Presentation not active');
            return done(null, false, {message: 'Presentation not active'});
        }
    })); 

    /*************************************************************************** 
    * Express General Configuration - Globals, Templating & Primary Middleware
    ***************************************************************************/
    app.configure(function(){
        // Globals
        app.set('recaptcha_private_key', '6LfDbNYSAAAAAKe1_4ay5OYkgn6LhZcroXTGyMAJ');
        app.set('recaptcha_public_key', '6LfDbNYSAAAAAEvCHOAGJQLRUZ68vhGICeAJ3z-t');
        app.set('admin_username', 'yeluapyeroc');
        app.set('admin_password', 'cmp1337*');
        app.set('presentationName', 'Interactive Web Design');
        app.set('presentationKey', 'Imaginuity');
        app.set('adminKey', 'admin1337');

        // View Settings
        var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(app.get('paths').views));
        app.set('nunjucksEnv', env);
        env.express(app);
        app.set('view options', {strict: true, layout: false});

        // Global template variables
        app.locals({
            BASE_URL: 'https://triviawithfriends.coreypauley.com',
            STATIC_URL: '/static/',
            DATETIME: opts.today,
            presentation: {title: 'Interactive Web Design'}
        });

        // Lightweight Middleware
        //app.use(express.favicon(path.join(app.get('paths').static, 'img/favicon.ico'), {maxAge: 2592000000}));

        // Query String Middleware
        app.use(express.query());
    });

    /*************************************************************************** 
    * Express Development Configuration - Top Level Logging & File Serving
    ***************************************************************************/
    app.configure('development', function(){
        app.set('port', process.env.PORT || 8000);
        // Verbose logging during development
        app.use(express.logger({immediate: true, format: 'dev'}));

        // Static files
        //app.use('/uploads', express.static(path.join(app.get('root'), 'uploads')));
        app.use('/static', express.static(app.get('paths').static));
    });

    /***************************************************************************
    * Express Production Configuration - Top Level Logging & File Serving
    ***************************************************************************/
    app.configure('production', function(){
        app.set('port', 28493);
        // Minimal logging during production and compress/cache static files
        app.use(express.logger('tiny'));
        app.use(express.compress());
        app.use(express.staticCache());

        // Static files
        app.use('/uploads', express.static(path.join(app.get('root'), 'uploads'), {maxAge: 86400000}));
        app.use('/static', express.static(app.get('paths').static, {maxAge: 86400000}));
    });

    /***************************************************************************
    * Express General Configuration - Middleware & Router
    ***************************************************************************/
    app.configure(function(){
        // Request dependent template variables
        app.use(function(req, res, next){
            res.locals.IS_IE = opts.ie_regex.test(req.headers['user-agent']);
            next();
        });

        // Middleware
        app.use(express.cookieParser());
        app.use(express.session({
            secret: secret,
            key: 'presentation.sid',
            store: sessionStore,
            cookie: {
                secure: false,
                maxAge: 86400000
            }
        }));
        app.use(express.bodyParser({keepExtensions: true, uploadDir: path.join(app.get('root'), 'uploads')}));
        app.use(passport.initialize());
        app.use(passport.session());
        //app.use(express.csrf());
        app.use(flash());
        app.use(express.responseTime());
    });

    /***************************************************************************
    * MongoDB Connection and Mongoose Setup
    ***************************************************************************/
    var db = mongoose.createConnection('localhost', 'TriviaWithFriends_db');
    db.on('error', console.error.bind(console, 'mongodb connection error'));
    db.once('open', function() {
        // Connected successfully
        console.log('Successfully connected to mongodb and initiated models');

        // Initialize mongoose FormFactory plugin
        FormFactory.init(app, mongoose);

        // Load mongoose models
        require("./models.js")(function(){
            // Start routing urls with Express
            app.use(app.router);
            require("./routes.js");
        });
    });

    /***************************************************************************
    * Url Routing Setup
    ***************************************************************************/

    /***************************************************************************
    * Express Development Configuration - Bottom Level Error Handling & Logging
    ***************************************************************************/
    app.configure('development', function() {
        app.use(express.logger({format: 'dev'}));

        // Error Handler
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));
    });

    /***************************************************************************
    * Express Production Configuration - Bottom Level Error Handling
    ***************************************************************************/
    app.configure('production', function() {
        app.use(express.errorHandler());
    }); 

    /***************************************************************************
    * Create the server, listen to the port set in the Express configuration
    * and setup socket.io to listen to the server
    ***************************************************************************/
    var server = http.createServer(app);
    io = sio.listen(server);
    server.listen(app.get('port'), function() {
        console.log("Express server listening on port " + app.get('port'));
        //console.log(app);
    }); 

    /***************************************************************************
    * Configure Socket.io
    ***************************************************************************/
    io.configure(function() {
        io.set('store', new SocketRedisStore({
            redisPub: SocketPubStore,
            redisSub: SocketSubStore,
            redisClient: SocketClientStore
        }));
    });

    require('./io')(io);
};
