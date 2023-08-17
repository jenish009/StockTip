const { gql } = require('apollo-server-express');

const userSubscriptionPlanTypeDef = gql`
  type Mutation {
    addUserSubscription(
      subscriptionPlanId: ID!
      userId: ID!
      startDate: String!
      duration : Int
    ): response
  }
`;

module.exports = { userSubscriptionPlanTypeDef };
