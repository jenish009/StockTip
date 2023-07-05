const { ApolloServer } = require('apollo-server');
const { connectDatabase } = require('./utils/connection')

const typeDefs = require('./src/schema/index')
const resolvers = require('./src/resolvers/index')

connectDatabase()
const server = new ApolloServer({
    typeDefs,
    resolvers,
    listen: { port: 8080 }

});

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
});
