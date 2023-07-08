const mongoose = require('mongoose');

// Define the User schema
const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    discription: {
      type: String,
      required: true,
    },
    monthlyPrice: {
      type: Number,
    },
    yearlyPrice: {
      type: Number,
    },
    days: {
      type: Number,
    },
  },
  { timestamps: true, versionKey: false },
);

const subscriptionPlanModel = mongoose.model(
  'subscriptionPlan',
  subscriptionPlanSchema,
);

module.exports = subscriptionPlanModel;
