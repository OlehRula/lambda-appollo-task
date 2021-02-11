import * as path from "path";
import { ApolloServer } from "apollo-server-lambda";
import {
    makeExecutableSchema,
    loadFilesSync,
    mergeTypeDefs,
    mergeResolvers,
} from "graphql-tools";

const apolloServer = () => {
    const graphqlTypes = loadFilesSync(path.join(__dirname, "schema.graphql"));
    const graphqlResolvers = loadFilesSync(
        path.join(__dirname, "controllers/**/*.resolvers.js")
    );

    const graphqlSchema = makeExecutableSchema({
        typeDefs: mergeTypeDefs(graphqlTypes),
        resolvers: mergeResolvers(graphqlResolvers),
    });

    return new ApolloServer({
        schema: graphqlSchema,
        context: async ({ context = {}, event }) => {
            context.callbackWaitsForEmptyEventLoop = false;

            return {
                event,
                context,
            };
        },
        playground: true,
        introspection: true,
    });
};

const runHandler = (event, context, handler) =>
    new Promise((resolve, reject) => {
        const callback = (error, body) =>
            error ? reject(error) : resolve(body);

        handler(event, context, callback);
    });

exports.graphqHandler = async (event, context) => {
    const server = apolloServer();
    const handler = server.createHandler({
        cors: { credentials: true, origin: "*" },
    });
    event.httpMethod = event.httpMethod || "POST";
    event.headers = {
        "Content-Type": "application/json",
        ...(event.headers || {}),
    };

    const response = await runHandler(event, context, handler);
    // disable db connection here in future
    return response;
};
