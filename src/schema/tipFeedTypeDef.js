const { gql } = require('apollo-server-express');

const tipFeedTypeDef = gql`
  type Query {
    getTipFeed(typeFilter: String, userId: ID!): response
    getTipModule: response

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
      isFutureOrEnquity : Boolean
      currentDate : String
      quantity : Int
      note : String
    ): response
    addUpdateTipModule(
      name : String
      imageLink : String
      index : Int
      id : ID
      ) : response
  }
  type Subscription {
    onTipAdd: response
  }
`;

module.exports = { tipFeedTypeDef };
