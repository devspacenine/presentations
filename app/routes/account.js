/*
var mongoose = require('mongoose'),
models = app.get('models'),
User = models.User;

module.exports = (function(){
*/
    /********************************************************************
    * GET register page.
    ********************************************************************/
    /*
    app.get('/register/', function(req, res) {
        User.ModelForm('register', function(err, form) {
            res.render('account/register.html', {
                form: form
            });
        });
    });
    */

    /********************************************************************
    * POST register page.
    ********************************************************************/
    /*
    app.post('/register/', function(req, res) {
        User.ModelForm(req, 'register', function(err, form) {
            form.setForm('register');
            form.validate(function(form) {
                console.log('Valid');
                form.save(function(saved) {
                    res.render('account/register.html', {
                        form: saved
                    });
                }, function(unsaved) {
                    res.render('account/register.html', {
                        form: unsaved
                    });
                });
            },function(form) {
                console.log('Invalid');
                res.render('account/register.html', {
                    form: form
                });
            },function(err) {
                console.log(err.stack);
                throw err;
            });
        });
    });
    */

    /********************************************************************
    * GET view users.
    ********************************************************************/
    /*
    app.get('/view-users/', function(req, res) {
        res.render('account/view-users.html', {
            users: User.find({})
        });
    });
})();
*/
