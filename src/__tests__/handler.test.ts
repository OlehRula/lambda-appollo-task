/* eslint-disable @typescript-eslint/no-var-requires */
const graphqlHandler = require("../../dist/handler").graphqlHandler;
import { ApolloServer, gql } from "apollo-server";
import { createTestClient } from "apollo-server-testing";
import { Connection } from "typeorm";

import { Database } from "../db/Database";
import { initTestSchema } from "../utils/initTestSchema";
import { asyncForEach } from "../utils/index";

it("graphqlHandler should be a function", async () => {
    console.log(graphqlHandler)
    expect(typeof graphqlHandler).toBe("function");
});

describe("Apollo Server", () => {
    let connection: Connection;
    const database = new Database();
    const server: any = new ApolloServer({
        schema: initTestSchema(),
    });
    const { query, mutate } = createTestClient(server);

    beforeAll(async () => {
        connection = await database.getConnection();
        /**
         * Testing database cleanup
         */
        const entities = connection.entityMetadatas;
        await asyncForEach(entities, async (entity) => {
            const repository = connection.getRepository(entity.name);
            await repository.query(`DELETE FROM ${entity.tableName}`);
        });
    });

    describe("Mutation", () => {
        it("addCharacter: only name input", async () => {
            const ADD_CHARACTER = gql`
                mutation {
                    addCharacter(character: { name: "newCharacter" }) {
                        name
                    }
                }
            `;

            const {
                data: { addCharacter },
            } = await mutate({ mutation: ADD_CHARACTER });
            expect(addCharacter).toEqual({ name: "newCharacter" });
        });

        it("addCharacter: Exception with already created character", async () => {
            const ADD_CHARACTER = gql`
                mutation {
                    addCharacter(character: { name: "newCharacter" }) {
                        name
                    }
                }
            `;

            const {
                errors: [error],
            } = await mutate({ mutation: ADD_CHARACTER });
            expect(error.message).toBe("newCharacter already exist.");
        });

        it("addCharacter: with planet field and relation with Episodes entity", async () => {
            const ADD_CHARACTER = gql`
                mutation {
                    addCharacter(
                        character: {
                            name: "newCharacter1"
                            episodes: ["episode1", "episode2"]
                            planet: "testPlanet"
                        }
                    ) {
                        name
                        episodes {
                            name
                        }
                        planet
                    }
                }
            `;

            const {
                data: { addCharacter },
                errors,
            } = await mutate({ mutation: ADD_CHARACTER });
            expect(addCharacter).toEqual({
                name: "newCharacter1",
                episodes: [{ name: "episode1" }, { name: "episode2" }],
                planet: "testPlanet",
            });

            const recentlyCreatedCharacter = await connection
                .getRepository("Characters")
                .findOne({ name: "newCharacter1" });
            const recentlyCreatedEpisode = await connection
                .getRepository("Episodes")
                .findOne({
                    relations: ["character"],
                    where: {
                        name: "episode1",
                    },
                });
            expect(recentlyCreatedEpisode["character"]["id"]).toBe(
                recentlyCreatedCharacter["id"]
            );
        });

        it("deleteCharacter: existing character", async () => {
            const DELETE_CHARACTER = gql`
                mutation {
                    deleteCharacter(name: "newCharacter") {
                        name
                    }
                }
            `;

            const {
                data: { deleteCharacter },
            } = await mutate({ mutation: DELETE_CHARACTER });
            expect(deleteCharacter).toEqual({ name: "newCharacter" });

            const recentlyDeletedCharacter = await connection
                .getRepository("Characters")
                .findOne({ name: "newCharacter" });
            expect(recentlyDeletedCharacter).toBe(undefined);
        });

        it("deleteCharacter: Exception with not existing character", async () => {
            const DELETE_CHARACTER = gql`
                mutation {
                    deleteCharacter(name: "newCharacter") {
                        name
                    }
                }
            `;

            const {
                errors: [error],
            } = await mutate({ mutation: DELETE_CHARACTER });
            expect(error.message).toBe("newCharacter is not exist.");
        });

        it("updateCharacter: with Episodes relations mechanic ", async () => {
            const UPDATE_CHARACTER = gql`
                mutation {
                    updateCharacter(
                        character: {
                            name: "newCharacter1"
                            episodes: ["episode2", "episode3"]
                            planet: "updated"
                        }
                    ) {
                        name
                        episodes {
                            name
                        }
                        planet
                    }
                }
            `;

            const {
                data: { updateCharacter },
            } = await mutate({ mutation: UPDATE_CHARACTER });
            expect(updateCharacter).toEqual({
                name: "newCharacter1",
                episodes: [{ name: "episode2" }, { name: "episode3" }],
                planet: "updated",
            });

            /**
             * Previosly existed 'episode1' should be deleted
             */
            const notUsedEpisode = await connection
                .getRepository("Episodes")
                .findOne({ name: "episode1" });
            expect(notUsedEpisode).toBe(undefined);
        });

        it("updateCharacter: Exception with not existing character", async () => {
            const UPDATE_CHARACTER = gql`
                mutation {
                    updateCharacter(character: { name: "newCharacter2" }) {
                        name
                    }
                }
            `;

            const {
                errors: [error],
            } = await mutate({ mutation: UPDATE_CHARACTER });
            expect(error.message).toBe("newCharacter2 is not exist.");
        });
    });

    describe("Query", () => {
        it("getCharacters: get list", async () => {
            const GET_CHARACTERS = gql`
                query {
                    getCharacters {
                        name
                        episodes {
                            name
                        }
                        planet
                    }
                }
            `;

            const {
                data: { getCharacters },
            } = await query({ query: GET_CHARACTERS });
            expect(getCharacters).toBeInstanceOf(Array);
            expect(getCharacters).toEqual([{
                name: "newCharacter1",
                episodes: [{ name: "episode2" }, { name: "episode3" }],
                planet: "updated",
            }]);
        });

        it("getCharacter: get single character", async () => {
            const GET_CHARACTER = gql`
                query {
                    getCharacter(name: "newCharacter1") {
                        name
                        episodes {
                            name
                        }
                        planet
                    }
                }
            `;

            const {
                data: { getCharacter },
                errors
            } = await query({ query: GET_CHARACTER });
            expect(typeof getCharacter).toBe("object");
            expect(getCharacter).not.toBeInstanceOf(Array);
            expect(getCharacter).toEqual({
                name: "newCharacter1",
                episodes: [{ name: "episode2" }, { name: "episode3" }],
                planet: "updated",
            });
        });
    });
});
