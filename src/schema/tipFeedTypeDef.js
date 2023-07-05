const { gql } = require('apollo-server');


const tipFeedTypeDef = gql`
  scalar JSONObject

  type Query {
    createTipFeed ( symbol:String!, targets:JSONObject, stopLoss: String!, direction : String!, date: String!, currentValue : String!, type : String!) : response
    getTipFeed (typeFilter : String) :response
  } 
`;

module.exports = { tipFeedTypeDef };
