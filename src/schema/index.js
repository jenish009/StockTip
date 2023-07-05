const { gql } = require('apollo-server');
const { userTypeDefs } = require('./userTypeDef');


// Combine type definitions
module.exports = gql`
  ${userTypeDefs}
`;

;
