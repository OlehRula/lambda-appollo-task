import { ApolloError } from "apollo-server-lambda";
import { asyncForEach, recordExisting } from "../../utils";
import { Characters } from "./characters.entity";
import { Episodes } from "../episodes/episodes.entity";
import Charater from "../../interfaces/character.interface";

export default {
    Query: {
        getCharacters: async (
            _: unknown,
            { limit = 10, offset = 0 }: { limit: number; offset: number }
        ): Promise<Characters[]> =>
            Characters.find({
                take: limit,
                skip: offset,
                relations: ["episodes"],
            }),
        getCharacter: async (_, { name }: { name: string }): Promise<Characters> =>
            Characters.findOne({
                relations: ["episodes"],
                where: { name },
            }),
    },
    Mutation: {
        addCharacter: async (
            _: unknown, 
            { character: { name, episodes, planet } } : { character: Charater }
        ): Promise<Characters> => {
            const characterExists = await Characters.findOne({
                where: { name },
            });

            if (characterExists)
                throw new ApolloError(`${name} already exist.`);

            const episodesRelations: Episodes[] = [];
            if (episodes) {
                await asyncForEach(episodes, async (episode: string) => {
                    const newEpisode = await Episodes.create({
                        name: episode,
                    }).save();
                    episodesRelations.push(newEpisode);
                });
            }

            const { id } = await Characters.create({
                name,
                episodes: episodesRelations,
                planet,
            }).save();
            
            return Characters.findOne({
                relations: ["episodes"],
                where: { id },
            });
        },
        deleteCharacter: async (_: unknown, { name }: { name: string }): Promise<Characters> => {
            const characterExists = await recordExisting<typeof Characters>(
                Characters,
                {
                    relations: ["episodes"],
                    where: { name },
                },
                name
            );

            if (!characterExists) throw new ApolloError(`${name} is not exist.`);

            await Characters.remove(characterExists);

            return characterExists;
        },
        updateCharacter: async (
            _: unknown,
            { character: { name, episodes = [], planet } }: { character: Charater }
        ): Promise<Characters> => {
            const characterExists: Characters = await recordExisting<typeof Characters>(
                Characters,
                {
                    relations: ["episodes"],
                    where: { name },
                },
                name
            );

            if (!characterExists) throw new ApolloError(`${name} is not exist.`);

            const episodesRelations: Episodes[] = [];
            if (episodes.length > 0) {
                await asyncForEach(characterExists.episodes, async (oldEpisode: Episodes) => {
                    const { name } = oldEpisode;
                    if (!episodes.includes(name)) {
                        await Episodes.remove(oldEpisode);
                    }
                });

                await asyncForEach(episodes, async (episode: string) => {
                    const episodeExists = await Episodes.findOne({ name: episode, character: characterExists });
                    if (!episodeExists) {
                        const newEpisode = await Episodes.create({ name: episode }).save();
                        episodesRelations.push(newEpisode);
                    } else {
                        episodesRelations.push(episodeExists);
                    }
                });
            }

            characterExists.episodes = episodesRelations.length > 0 ? episodesRelations : characterExists.episodes;
            characterExists.planet = planet || characterExists.planet;
            const updatedCharacter = await characterExists.save();

            return updatedCharacter;
        },
    },
};
