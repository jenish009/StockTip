const { gql } = require('apollo-server');


const userTypeDefs = gql`
  scalar JSONObject

  type Query {
   
    getUserById (id : ID!) : response
  } 
  type Mutation {
    login ( email:String!, password:String! ) : response
    signup (email:String!, password:String!, name: String! ) : response
  } 
`;

module.exports = { userTypeDefs };
