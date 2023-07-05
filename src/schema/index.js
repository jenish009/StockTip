const { gql } = require('apollo-server');
const { userTypeDefs } = require('./userTypeDef');
const { tipFeedTypeDef } = require('./tipFeedTypeDef');



// Combine type definitions
module.exports = gql`

type response {
  data : JSONObject,
  message : String,
  error : String,
  statusCode : Int!
}
  ${userTypeDefs}
  ${tipFeedTypeDef}
`;

;
