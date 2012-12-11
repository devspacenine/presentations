var mongoose = require('mongoose'),
plugins = require('../_plugins'),
getters = require('../_getters'),
FormFactory = require('/home/yeluapyeroc/workspace/Node Workspaces/Packages/mongoose-form-factory'),
Schema = mongoose.Schema,
ObjectId = Schema.Types.ObjectId,
GroupSchema = new Schema({
    title: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        get: getters.Titleize,
        required: true
    },
    permissions: [{
        type: ObjectId,
        ref: 'Permission'
    }],
    _users: [{
        type: ObjectId,
        ref: 'User'
    }]
});

GroupSchema.plugin(plugins.Timestamps);

module.exports = mongoose.model('Group', GroupSchema);
