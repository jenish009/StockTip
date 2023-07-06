const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId

// Define the User schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNo: {
        type: Number,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    roleId: {
        type: ObjectId,
    },
}, { timestamps: true, versionKey: false });

// Create the User model
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
