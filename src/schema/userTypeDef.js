const { gql } = require('apollo-server');


const userTypeDefs = gql`
  scalar JSONObject

type response {
  body : [JSONObject],
  error : String,
  statusCode : Int!
}
  type Query {
    login ( email:String!, password:String! ) : response
  }
`;

module.exports = { userTypeDefs };
