const mongoose = require('mongoose');

// Define the User schema
const otpSchema = new mongoose.Schema(
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
            expires: 100,
        },
    },
    { versionKey: false },
);

const otpModel = mongoose.model('otp', otpSchema);

module.exports = otpModel;
