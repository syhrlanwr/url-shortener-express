const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    urlOriginal: {
        type: String,
        required: true
    },
    urlShort: {
        type: String,
        required: true
    },
    urlShortId: {
        type: String,
        required: true
    },
    clicks: {
        type: Number,
        required: true,
        default: 0
    }
});

module.exports = mongoose.model('Url', urlSchema);