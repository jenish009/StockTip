const { gql } = require('apollo-server');



const userTypeDefs = gql`
  type Query {
    getUserById (id : ID!) : response
  }
   
  type Mutation {
    login ( phoneNo:BigInt!, password:String! ) : response
    signup (email:String!, password:String!, name: String! , phoneNo :BigInt! ) : response
  }
`;

module.exports = { userTypeDefs };
