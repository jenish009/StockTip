const mongoose = require('mongoose');

// Define the User schema
const appMetaDataSchema = new mongoose.Schema(
    {
        version: {
            type: String,
        },
        link: {
            type: String,
        },
        componyPhoneNumber: {
            type: String,
        },
    },
    { versionKey: false, timestamps: true },
);

const appMetaDataModel = mongoose.model('appMetaData', appMetaDataSchema);

module.exports = appMetaDataModel;
