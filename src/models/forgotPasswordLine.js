const mongoose = require('mongoose');

// Define the User schema
const forgotPasswordLinkSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
        },
        otp: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 300,
        },
    },
    { versionKey: false },
);

const forgotPasswordLinkModel = mongoose.model('forgotPasswordLink', forgotPasswordLinkSchema);

module.exports = forgotPasswordLinkModel;
