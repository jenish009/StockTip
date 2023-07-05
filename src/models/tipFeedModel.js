const mongoose = require('mongoose');

// Define the User schema
const tipFeedSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
    },
    currentValue: {
        type: String,
        required: true,
    },
    targets: {
        type: Array
    },
    stopLoss: {
        type: String
    },
    direction: {
        type: String
    },
    date: {
        type: Date,
        required: true,
    },
    type: {
        type: String
    }
}, { timestamps: true, versionKey: false });

const tipFeedModel = mongoose.model('tipFeed', tipFeedSchema);

module.exports = tipFeedModel;
