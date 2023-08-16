const userResolver = require('./userResolver');
const tipFeedResolver = require('./tipFeedResolver');
const subscriptionPlanResolver = require('./subscriptionPlanResolver');
const userSubscriptionPlanResolver = require('./userSubscriptionPlanResolver');
const appMetaDataResolver = require('./appMetaData');


module.exports = {
  Query: {
    ...userResolver.Query,
    ...tipFeedResolver.Query,
    ...subscriptionPlanResolver.Query,
    ...appMetaDataResolver.Query
  },
  Mutation: {
    ...userResolver.Mutation,
    ...tipFeedResolver.Mutation,
    ...subscriptionPlanResolver.Mutation,
    ...userSubscriptionPlanResolver.Mutation,
    ...appMetaDataResolver.Mutation

  },
  Subscription: {
    ...userResolver.Subscription,
    ...tipFeedResolver.Subscription
  },
};
