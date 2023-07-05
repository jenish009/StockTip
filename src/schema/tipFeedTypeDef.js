const { gql } = require('apollo-server');



const tipFeedTypeDef = gql`
  scalar JSONObject

  type Query {
    getTipFeed (typeFilter : String) :response
  } 
  type Mutation {
    createTipFeed ( symbol:String!, targets:JSONObject, stopLoss: String!, direction : String!, date: String!, currentValue : String!, type : String!) : response
  } 
`;

module.exports = { tipFeedTypeDef };
