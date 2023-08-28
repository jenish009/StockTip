const express = require('express');
const { createServer } = require('http');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const { connectDatabase } = require('./utils/connection')
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./src/schema/index');
const resolvers = require('./src/resolvers/index');
require('dotenv').config();

(async function () {
    const app = express();

    const httpServer = createServer(app);
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const subscriptionServer = SubscriptionServer.create(
        { schema, execute, subscribe },
        { server: httpServer, path: '/graphql' },
    );
    const server = new ApolloServer({
        schema,
        persistedQueries: {
            cache: 'bounded', // Set the cache to be bounded
        },
        plugins: [

            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            subscriptionServer.close();
                        },
                    };
                },
            },
        ],
    });

    await server.start();
    server.applyMiddleware({ app });

    await connectDatabase()

    const PORT = process.env.PORT;
    httpServer.listen(PORT, () => {
        console.log(`Server is now running on http://localhost:${PORT}/graphql`);
    });
})();


