var mongoose = require('mongoose'),
plugins = require('../_plugins'),
getters = require('../_getters'),
FormFactory = require('/home/yeluapyeroc/workspace/Node Workspaces/Packages/mongoose-form-factory'),
Schema = mongoose.Schema,
ObjectId = Schema.Types.ObjectId,
CategorySchema = new Schema({
    title: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        get: getters.Titleize,
        required: true
    },
    sub_categories: [{
        type: ObjectId,
        ref: 'SubCategory'
    }]
});

CategorySchema.plugin(plugins.Timestamps);

module.exports = mongoose.model('Category', CategorySchema);
