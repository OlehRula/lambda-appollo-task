import * as path from "path";
import {
    makeExecutableSchema,
    loadFilesSync,
    mergeTypeDefs,
    mergeResolvers,
} from "graphql-tools";

const initTestSchema = () => {
    const graphqlTypes = loadFilesSync(path.join(__dirname, "../../dist/schema.graphql"));
    const graphqlResolvers = loadFilesSync(
        path.join(__dirname, "../../dist/controllers/**/*.resolvers.js")
    );

    return makeExecutableSchema({
        typeDefs: mergeTypeDefs(graphqlTypes),
        resolvers: mergeResolvers(graphqlResolvers),
    });
};

export {
    initTestSchema
};
