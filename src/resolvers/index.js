const userResolver = require('./userResolver');
const tipFeedResolver = require('./tipFeedResolver');
const subscriptionPlanResolver = require('./subscriptionPlanResolver');
const userSubscriptionPlanResolver = require('./userSubscriptionPlanResolver');

module.exports = {
  Query: {
    ...userResolver.Query,
    ...tipFeedResolver.Query,
    ...subscriptionPlanResolver.Query,
  },
  Mutation: {
    ...userResolver.Mutation,
    ...tipFeedResolver.Mutation,
    ...subscriptionPlanResolver.Mutation,
    ...userSubscriptionPlanResolver.Mutation,
  },
  Subscription: {
    ...userResolver.Subscription,
    ...tipFeedResolver.Subscription
  },
};
