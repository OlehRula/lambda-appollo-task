import { ApolloError } from "apollo-server-lambda";
import { FindOneOptions } from "typeorm";

const asyncForEach = async <T>(
    array: T[],
    callback: (element: T, index: number, array: T[]) => Promise<void>
): Promise<void> => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
};

const recordExisting = async <T>(
    Entity: T,
    conditions: FindOneOptions,
    recordName: string
): Promise<any> => {
    // @ts-ignore
    const record = await Entity.findOne(conditions);

    if (!record) throw new ApolloError(`${recordName} is not exist.`);
    return record;
};

export { asyncForEach, recordExisting };
