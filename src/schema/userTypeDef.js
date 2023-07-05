const { gql } = require('apollo-server');


const userTypeDefs = gql`
  scalar JSONObject

type response {
  data : JSONObject,
  message : String,
  error : String,
  statusCode : Int!
}
  type Query {
    login ( email:String!, password:String! ) : response
    signup (email:String!, password:String!, name: String! ) : response
    getUserById (id : ID!) : response
  } 
`;

module.exports = { userTypeDefs };
