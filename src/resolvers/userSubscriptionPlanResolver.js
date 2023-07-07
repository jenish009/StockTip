const {
  userSubscriptionPlanModel,
  subscriptionPlanModel,
} = require('../models/index');
const moment = require('moment');
const addUserSubscription = async (
  _,
  { subscriptionPlanId, userId, startDate },
) => {
  try {
    if (!subscriptionPlanId) throw new Error('Please Select Subscription');
    if (!userId) throw new Error('Please Enter User Id');

    let subscriptionData = await subscriptionPlanModel.findOne({
      _id: subscriptionPlanId,
    });
    if (!subscriptionData) throw new Error('Subscription Plan Not Found');

    const expireDate = moment(startDate).add(subscriptionData.days, 'days');

    let createUserSubsciption = await userSubscriptionPlanModel.create({
      subscriptionPlanId,
      userId,
      startDate,
      expireDate,
    });

    if (!createUserSubsciption) throw new Error('Something Went Wrong');

    return {
      message: 'Subscription Plan Added To User Account',
      statusCode: 200,
    };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

module.exports = {
  Mutation: {
    addUserSubscription,
  },
};
