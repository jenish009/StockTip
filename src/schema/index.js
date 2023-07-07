const { gql } = require('apollo-server-express');
const { userTypeDefs } = require('./userTypeDef');
const { tipFeedTypeDef } = require('./tipFeedTypeDef');
const { subscriptionPlanTypeDef } = require('./subscriptionPlanTypeDef');
const {
  userSubscriptionPlanTypeDef,
} = require('./userSubscriptionPlanTypeDef');

// Combine type definitions
module.exports = gql`
  type response {
    data: JSONObject
    message: String
    error: String
    statusCode: Int!
  }

  scalar JSONObject
  scalar BigInt

  ${tipFeedTypeDef}
  ${userTypeDefs}
  ${subscriptionPlanTypeDef}
  ${userSubscriptionPlanTypeDef}
`;
