const { gql } = require('apollo-server-express');

const userTypeDefs = gql`
  type Query {
    getUserById(id: ID!): response
  }

  type Mutation {
    login(phoneNo: BigInt!, password: String!): response
    signup(
      email: String!
      name: String!
    ): response
  }

  type Subscription {
    onLogin: response
  }
`;

module.exports = { userTypeDefs };
