const { gql } = require('apollo-server-express');

const appMeataDataTypeDef = gql`
  type Query {
    getAppMetaData: response
  }

  type Mutation {
    addAppMetaData(body : JSONObject): response
  }
`;

module.exports = { appMeataDataTypeDef };
