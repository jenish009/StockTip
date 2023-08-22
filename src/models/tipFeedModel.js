const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Define the User schema
const tipFeedSchema = new mongoose.Schema(
  {
    position: {
      type: String,
    },
    stopLoss: {
      type: String,
    },
    entry: {
      type: String,
    },
    entry_date: {
      type: String,
    },
    status: {
      type: String,
    },
    quantity: {
      type: String
    },
    confirmation: {
      type: String
    },
    targets: {
      type: Array,
    },
    isEntryMissed: {
      type: Boolean,
    },
    entryMissedInstruction: {
      type: String,
    },
    isStopLossMissed: {
      type: Boolean,
    },
    stopLossMissedInstruction: {
      type: String,
    },
    note: {
      type: String,
    },
    subscriptionId: {
      type: [ObjectId],
      default: null,
    },
    moduleId: {
      type: ObjectId,
    },
    symbol: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

const tipFeedModel = mongoose.model('tipFeed', tipFeedSchema);

module.exports = tipFeedModel;
