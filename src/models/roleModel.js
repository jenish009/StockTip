const mongoose = require('mongoose');

// Define the User schema
const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
}, { timestamps: true, versionKey: false });

// Create the role model
const roleModel = mongoose.model('role', roleSchema);

module.exports = roleModel;
