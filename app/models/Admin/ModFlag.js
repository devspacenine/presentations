var mongoose = require('mongoose'),
plugins = require('../_plugins'),
FormFactory = require('/home/yeluapyeroc/workspace/Node Workspaces/Packages/mongoose-form-factory'),
Schema = mongoose.Schema,
ObjectId = Schema.Types.ObjectId,
Mixed = Schema.Types.Mixed,
ModFlagSchema = new Schema({
    _administrator: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    target: Mixed,
    flag_type: {
        type: ObjectId,
        ref: 'ModFlagType',
        required: true
    },
    title: {
        type: String,
        trim: true,
        required: true
    },
    comment: {
        type: String,
        trim: true,
        required: true
    },
    weight: {
        type: Number,
        default: 1
    }
});

ModFlagSchema.plugin(plugins.Timestamps);

module.exports = mongoose.model('ModFlag', ModFlagSchema);
