/* eslint-disable @typescript-eslint/no-var-requires */
const graphqlHandler = require("../../dist/handler").graphqlHandler;
import { ApolloServer, gql } from "apollo-server";
import { createTestClient } from "apollo-server-testing";

import { Database } from "../db/Database";

it("graphqlHandler should be a function", async () => {
    expect(typeof graphqlHandler).toBe("function");
});
