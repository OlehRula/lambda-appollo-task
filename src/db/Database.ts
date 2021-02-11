import { Connection, ConnectionManager, ConnectionOptions, createConnection, getConnectionManager } from "typeorm";

export class Database {
    private connectionManager: ConnectionManager;
    private connection: Promise<Connection>;
    private readonly options: ConnectionOptions = {
        type: "mysql",
        host: process.env.DB_URL,
        port: parseInt(process.env.DB_PORT) || 3306,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        entities: [process.cwd() + "/dist/controllers/**/*.entity.js"],
        synchronize: true,
        logging: false,
    };

    constructor() {
        this.connectionManager = getConnectionManager();
        this.connection = this.connect();
    }

    private connect = async (): Promise<Connection> => {
        return await createConnection(this.options);
    };

    public getConnection = async (): Promise<Connection> => {
        try {
            const connection = this.connectionManager.get();
            return connection.isConnected ? connection : this.connect();
        } catch (e) {
            console.warn(e);
            return this.connect();
        }
    }

    public closeConnection = async (): Promise<void> => this.connectionManager.get().close();
}
