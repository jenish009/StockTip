const { gql } = require('apollo-server');


const userSubscriptionPlanTypeDef = gql`
  type Mutation {
    addUserSubscription ( subscriptionPlanId:ID!, userId:ID!, startDate: String!) : response
  }
`;

module.exports = { userSubscriptionPlanTypeDef };
