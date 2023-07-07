const { gql } = require('apollo-server-express');

const userTypeDefs = gql`
  type Query {
    getUserById(id: ID!): response
  }

  type Mutation {
    login(phoneNo: BigInt!, password: String!): response
    signup(
      email: String!
      password: String!
      name: String!
      phoneNo: BigInt!
    ): response
  }

  type Subscription {
    onLogin: response
  }
`;

module.exports = { userTypeDefs };
