var passport = require('passport'),
redisClient = app.get('redisClient');

module.exports = (function(){
/********************************************************************
* GET home page.
********************************************************************/
    app.get('/', function(req, res){
        res.render('home.html', {sessionId: req.cookies['presentation.sid'] || '0', error: req.query['error']});
    });

    app.post('/presentation', passport.authenticate('local', {failureRedirect: '/?error=login', failureFlash:true}), function(req, res){
        redisClient.get('presentation', function(err, val){
            if(err) {
                console.log(err.stack);
                res.redirect('/?error=connect')
                return;
            }
            if(val || req.user.admin) {
                var sessionId = req.sessionID,
                userKey = 'user:' + sessionId;
                req.user.sessionId = sessionId;
                if(!redisClient.exists(userKey)) {
                    redisClient.sadd('users', userKey);
                    redisClient.hmset(userKey, {id: 0, name: 'Anonymous', admin: req.user.admin, ready: false, presentation_key: req.user.presentation_key, sessionId: sessionId});
                }
                res.render('presentation.html', {user: req.user, userJSON: JSON.stringify(req.user)});
            }else{
                res.redirect('/?error=connect')
            }
        });
    });

    app.get('/presentation', function(req, res){
        //console.log(res);
        if(req.user) {
            res.render('presentation.html', {user: req.user});
        }else{
            res.redirect('/');
        }
    });

    app.get('/disconnect', function(req, res){
        var sessionId = req.sessionID,
        userKey = 'user:' + sessionId;
        redisClient.srem('users', userKey);
        redisClient.del(userKey);
        res.redirect('/');
    });
})();
