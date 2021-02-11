import * as path from "path";
import { ApolloServer } from "apollo-server-lambda";
import {
    makeExecutableSchema,
    loadFilesSync,
    mergeTypeDefs,
    mergeResolvers,
} from "graphql-tools";
import { Database } from "./db/Database";

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

exports.graphqlHandler = async (event, context) => {
    const database = new Database();
    await database.getConnection();

    const server = apolloServer();
    const handler = server.createHandler({
        cors: { credentials: true, origin: "*" },
    });
    event.httpMethod = event.httpMethod || "POST";
    event.headers = {
        "content-type": "application/json",
        ...(event.headers || {}),
    };
    const response = await runHandler(event, context, handler);
    await database.closeConnection();
    return response;
};
