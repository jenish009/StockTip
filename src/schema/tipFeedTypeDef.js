const { gql } = require('apollo-server-express');

const tipFeedTypeDef = gql`
  type Query {
    getTipFeed(typeFilter: String, userId: ID!): response
  }

  type Mutation {
    createTipFeed(
      symbol: String!
      targets: JSONObject
      stopLoss: String!
      direction: String!
      date: String!
      currentValue: String!
      type: String!
      subscriptionId: [String]
    ): response
  }
`;

module.exports = { tipFeedTypeDef };
