const mongoose = require('mongoose');

// Define the User schema
const moduleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        imageLink: {
            type: String,
        },
        index: {
            type: Number,
        }
    },
    { versionKey: false, timestamps: true },
);

const moduleModel = mongoose.model('module', moduleSchema);

module.exports = moduleModel;
