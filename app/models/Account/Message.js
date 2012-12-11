var mongoose = require('mongoose'),
plugins = require('../_plugins'),
FormFactory = require('/home/yeluapyeroc/workspace/Node Workspaces/Packages/mongoose-form-factory'),
Schema = mongoose.Schema,
ObjectId = Schema.Types.ObjectId,
MessageSchema = new Schema({
    _user: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    _from_user: {
        type: ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        trim: true,
        required: true
    },
    body: {
        type: String,
        trim: true,
        required: true
    },
    flags: [{
        type: ObjectId,
        ref: 'ModFlag'
    }]
});

MessageSchema.plugin(plugins.Timestamps);

module.exports = mongoose.model('Message', MessageSchema);
