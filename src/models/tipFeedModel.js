const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Define the User schema
const tipFeedSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
    },
    currentValue: {
      type: String,
      required: true,
    },
    targets: {
      type: Array,
    },
    stopLoss: {
      type: String,
    },
    direction: {
      type: String,
    },
    trading_date: {
      type: Date,
      required: true,
    },
    next_trading_date: {
      type: Date,
      required: true,
    },
    position: {
      type: String,
    },
    entry_price: {
      type: String,

    },
    entry_date: {
      type: Date,
    },
    type: {
      type: String,
    },
    subscriptionId: {
      type: [ObjectId],
      default: null,
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
    isFutureOrEnquity: {
      type: Boolean,
    },
    currentDate: {
      type: Date,
    },
    quantity: {
      type: Number
    },
    note: {
      type: String,
    },
    moduleId: {
      type: [ObjectId],
    }
  },
  { timestamps: true, versionKey: false },
);

const tipFeedModel = mongoose.model('tipFeed', tipFeedSchema);

module.exports = tipFeedModel;
