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
      trading_date : String
      next_trading_date : String
      position : String
      entry_price : String
      entry_date : String
      isEntryMissed : Boolean   
      entryMissedInstruction : String
      isStopLossMissed : Boolean
      stopLossMissedInstruction : String   
    ): response
  }
  type Subscription {
    onTipAdd: response
  }
`;

module.exports = { tipFeedTypeDef };
