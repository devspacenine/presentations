var mongoose = require('mongoose'),
attachments = require('mongoose-attachments'),
validator = require('mongoose-validator').validate,
setters = require('../_setters'),
validators = require('../_validators'),
plugins = require('../_plugins'),
crypto = require('crypto'),
uuid = require('node-uuid'),
FormFactory = require('/home/yeluapyeroc/workspace/Node Workspaces/Packages/mongoose-form-factory'),
now = new Date(),
Schema = mongoose.Schema,
ObjectId = Schema.Types.ObjectId,
Password = Schema.Types.Password,
Image = Schema.Types.Image,
Bool = Schema.Types.Bool,
File = Schema.Types.File,
Email = Schema.Types.Email,
Url = Schema.Types.Url,
UserSchema = new Schema({
    // Login Info
    username: {
        type: String,
        unique: true,
        trim: true,
        placeholder: 'Username',
        validate: [
            validator('max', 256, 'Username must be shorter than 256 characters'),
            validator('isAlphanumeric', 'Invalid Username: Can only contain letters and numbers')
        ],
        required: true,
        help_text: 'A unique name, at least 6 alphanumeric characters long, that you will use to sign into your account'
    },
    password: {
        type: Password,
        placeholder: 'Password',
        salt: 'salt',
        required: true
    },
    salt: {
        type: String,
        required: true,
        editable: false
    },
    // Email
    email: {
        type: Email,
        lowercase: true,
        trim: true,
        unique: true,
        placeholder: 'Email Address',
        required: true
    },
    email_verification_key: {
        type: String,
        unique: true,
        required: true,
        editable: false
    },
    email_verification_key_expiration_date: {
        type: Date,
        editable: false
    },
    // Identity Info
    first_name: {
        type: String,
        placeholder: 'First Name'
    },
    last_name: {
        type: String,
        placeholder: 'Last Name',
    },
    phone_number: {
        type: String,
        placeholder: 'Phone Number',
        validate: [validators.PhoneNumber, 'Invalid Phone Number Format'],
        set: setters.PhoneNumber
    },
    address: {
        line_1: String,
        line_2: {
            type: String
        },
        city: String,
        state: String,
        zip: String,
        country: String
    },
    // Flags
    active: {
        type: Bool,
        default: false,
        admin_only: true
    },
    logged_in: {
        type: Bool,
        default: false,
        editable: false
    },
    disabled: {
        type: Bool,
        default: false,
        admin_only: true
    },
    suspended: {
        type: Bool,
        default: false,
        admin_only: true
    },
    email_verified: {
        type: Bool,
        default: false,
        admin_only: true
    },
    staff: {
        type: Bool,
        default: false,
        admin_only: true
    },
    superuser: {
        type: Bool,
        default: false,
        admin_only: true
    },
    // Session Info and Logs
    login_ip: {
        type: String,
        editable: false,
        validate: [validators.IPAddress, 'Invalid IP Address']
    },
    login_logs: [{
        type: ObjectId,
        ref: 'LoginLog',
        admin_only: true
    }],
    // Groups and Permissions
    groups: [{
        type: ObjectId,
        ref: 'Group',
        admin_only: true
    }],
    permissions: [{
        type: ObjectId,
        ref: 'Permission',
        admin_only: true
    }],
    // Dates and Times
    suspened_until: {
        type: Date,
        admin_only: true
    },
    last_login: {
        type: Date,
        editable: false
    },
    date_joined: {
        type: Date,
        editable: false
    }
});

/*******************************************************************************
* Static Methods
*******************************************************************************/

/*******************************************************************************
* hash
* ------------------------------------------------------------------------------
*
* Generates a sha256 HMAC with the supplied salt and arbitrary data and digests
* it in hex format.
*
*******************************************************************************/
UserSchema.static('hash', function(data, salt) {
    return crypto.createHmac('sha256', salt).update(data).digest('hex');
});

/*******************************************************************************
* findByUsername
* ------------------------------------------------------------------------------
*
* Retrieve a User document by username.
*
*******************************************************************************/
UserSchema.static({
    findByUsername: function(username, done) {
        return this.find({username: username}, done);
    },

/*******************************************************************************
* sendVerificationEmail
* ------------------------------------------------------------------------------
*
* Send an email to a newly registered user with a link to verify his/her email
* address and activate their account.
*
*******************************************************************************/
    sendVerificationEmail: function(name, email, key) {
        var smtp = app.get('emailTransport')(),
        mailOptions = {
            from: app.get('noReplyEmail'),
            to: '"' + name + '" <' + email + '>',
            subject: 'Trivia With Friends - Email Verification',
            html: app.get('templateEnv').getTemplate('email/verify_email.html').render({
                name: name,
                key: key
            })
        };
        smtp.sendMail(mailOptions, function(err, res) {
            if(err) {
                console.log('Error sending verification email');
                console.log(err);
                return;
            }
            console.log('Verification email for {1} sent to {2}.'.assign(name, email));
            // Close email transport
            smtp.close();
        });
    },

/*******************************************************************************
* verifyEmail
* ------------------------------------------------------------------------------
*
* Check to see if the given key belongs to a currently inactive/unverified
* user. If it is expired, start the email verification process over.
*
*******************************************************************************/
    verifyEmail: function(key) {
        mongoose.model('User').findOne({email_verification_key: key}, function(err, user) {
            if(err) {
                console.log(err);
                // TODO send response saying this is an invalid email address blah blah.
                return;
            }
            user.activateAccount(key);
        });
    }
});

/*****************************************************************************
* Instance Methods
*****************************************************************************/
UserSchema.method({
    setPassword: function(password) {
        this.password_hash = hash(password, this.salt);
    },

    validPassword: function(password) {
        return this.password_hash === hash(password, this.salt);
    },

    isActive: function() {
        return this.active && !this.disabled && !this.suspended;
    },

    activateAccount: function(key) {
        if(this.email_verified && this.active) {
            // Account is already activated and email confirmed
            return;
        }
        if(key === this.email_verification_key) {
            if(this.email_verification_key_expiration_date.isAfter(new Date())) {
                this.email_verified = true;
                this.active = true;
                this.date_joined = new Date();
                this.email_verification_key_expiration_date = null;
                this.save(function(err) {
                    if(err) {
                        console.log('Failed to activate this with valid verification key');
                        console.log(err);
                        // TODO send email response saying activation failed. Reset key and try again.
                        return;
                    }
                    // TODO send success/thankyou email
                });
            }else{
                // TODO send response saying the key has expired. Reset key and try again
            }
        }else{
            // TODO send response saying the key did not match
        }
    }
});

/*****************************************************************************
* Middleware
*****************************************************************************/
// When the user is created, set an email verification expiration date
UserSchema.pre('validate', function(next) {
    if(this.isNew && this.email) {
        this.salt = uuid.v4();
        this.email_verification_key = crypto.createHmac('sha256', uuid.v1()).update(this.email).digest('hex');
        this.email_verification_key_expiration_date = now.setDate(now.getDate() + 3);
    }
    next();
});

UserSchema.plugin(plugins.Timestamps);

function comparePasswords(val, fieldValues) {
    return val === fieldValues.password;
}

UserSchema.plugin(FormFactory.Options, {
    settings: {
    },
    fields: {
        /*
        captcha: {
            widget: 'captcha',
            type: 'captcha',
            only: ['create'] // only appear on this form
        },
        */
        confirm_password: {
            placeholder: 'Confirm Password',
            before: 'first_name',
            after: 'password',
            forms: ['create', 'update'],
            required: true,
            type: Password
        }
        /*
        old_password: {
            forms: ['update'],
            required: true,
            type: Password,
            validators: [function(value, fields, callback) {
            }]
        },
        mugshot: {
            widget: 'ImageFile',
            order: 5,
            forms: ['create', 'update'],
            extensions: ['jpg','gif','png','jpeg','bmp']
        },
        remember: {
            forms: ['authenticate'],
            type: Boolean,
            editable: false
        }
        */
    },
    validators: {
        confirm_password: [comparePasswords, 'Passwords must match', ['password']]
    },
    forms: {
        register: {
            fields: ['username', 'password', 'confirm_password', 'email']
        },
        login: {
            fields: ['username', 'password']
        }
    }
});

module.exports = mongoose.model('User', UserSchema);
