const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Define the User schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNo: {
      type: Number,
    },
    countryCode: {
      type: String,
    },
    password: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    roleId: {
      type: ObjectId,
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true, versionKey: false },
);

// Create the User model
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
