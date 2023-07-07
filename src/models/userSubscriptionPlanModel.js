const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Define the User schema
const userSubscriptionPlanSchema = new mongoose.Schema(
  {
    subscriptionPlanId: {
      type: ObjectId,
      required: true,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expireDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

const userSubscriptionPlanModel = mongoose.model(
  'userSubscriptionPlan',
  userSubscriptionPlanSchema,
);

module.exports = userSubscriptionPlanModel;
