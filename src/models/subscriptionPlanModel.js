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
    price: {
      type: Array,
    },
    index: {
      type: Number,
      required: true,
    }
  },
  { timestamps: true, versionKey: false },
);

const subscriptionPlanModel = mongoose.model(
  'subscriptionPlan',
  subscriptionPlanSchema,
);

module.exports = subscriptionPlanModel;
