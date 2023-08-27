const { gql } = require('apollo-server-express');

const tipFeedTypeDef = gql`
  type Query {
    getTipFeed(userId: ID!, moduleId : ID): response
    getTipModule: response
    getTipForExel(moduleId : ID) : response

  }

  type Mutation {
    createTipFeed(
      position : String
      symbol: String!
      stopLoss: String
      entry : String
      entry_date : String
      status : String
      quantity : String
      confirmation : String
      targets: JSONObject
      isEntryMissed : Boolean   
      entryMissedInstruction : String
      isStopLossMissed : Boolean
      stopLossMissedInstruction : String   
      note : String
      moduleId : ID
      subscriptionId: [String]
      id : ID
    ): response
    addUpdateTipModule(
      name : String
      imageLink : String
      index : Int
      id : ID
      ) : response
    deleteTipFeed(id : ID): response
    bulkCreate(data: JSONObject!): response
  }
  type Subscription {
    onTipAdd: response
  }
`;

module.exports = { tipFeedTypeDef };
