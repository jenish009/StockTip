const { gql } = require('apollo-server-express');

const subscriptionPlanTypeDef = gql`
  type Query {
    getsubscriptionPlan(id: ID): response
  }
  type Mutation {
    createsubscriptionPlan(
      name: String!
      discription: String
      amount: Int
      days: Int
    ): response
  }
`;

module.exports = { subscriptionPlanTypeDef };
