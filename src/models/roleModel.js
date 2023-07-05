const mongoose = require('mongoose');

// Define the User schema
const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
});

// Create the role model
const roleModel = mongoose.model('role', roleSchema);

module.exports = roleModel;
