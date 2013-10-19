var mongoose = require('mongoose'),
plugins = require('../_plugins'),
getters = require('../_getters'),
FormFactory = require('/home/cpauley/src/mongoose-form-factory'),
Schema = mongoose.Schema,
ObjectId = Schema.Types.ObjectId,
PermissionSchema = new Schema({
    value: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        get: getters.Titleize,
        required: true
    },
    _users: [{
        type: ObjectId,
        ref: 'User'
    }],
    _groups: [{
        type: ObjectId,
        ref: 'Group'
    }]
});

PermissionSchema.plugin(plugins.Timestamps);

module.exports = mongoose.model('Permission', PermissionSchema);
