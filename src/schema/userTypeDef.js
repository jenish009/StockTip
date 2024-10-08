const { gql } = require('apollo-server-express');

const userTypeDefs = gql`
  type Query {
    getUserById(id: ID!): response
    forgotPasswordSendOtp(phoneOrEmail : String!, countryCode : String) : response
  }

  type Mutation {
    login(phoneNo: BigInt!, password: String!, countryCode : String): response
    signup( email: String!, name: String!): response
    verifyOtp(email : String!, otp : String!):response
    updateProfile(id:ID!, phoneNo:String, password : String, name : String, email : String, countryCode : String ) : response
    forgotPassword(email : String! , password : String!) : response
  } 

  type Subscription {
    onLogin: response
  }
`;

module.exports = { userTypeDefs };
