import { DataSource } from 'typeorm';
import { getSecretValue } from '../aws/secret-manager.service';
import { Lecture } from './entities/lecture';
import { ERROR_TYPES } from '../../../helpers/api-response.enum';
import { LectureStepStatus } from './entities/lecture-step-status';

const { SECRET_ID } = process.env;

/**
 * Database manager class
 */
class Database {
    private static connection: DataSource;

    public static async getConnection() {
        try {
            if (this.connection && this.connection.isInitialized) {
                console.info('Database ~ getConnection() ~ using existing connection');
            } else {
                console.info('Database ~ getConnection() ~ creating new connection');
                const dbCredentials = await getSecretValue(SECRET_ID);
                const dataSource = new DataSource({
                    type: 'postgres',
                    host: dbCredentials.host,
                    port: parseInt(dbCredentials.port, 10),
                    username: dbCredentials.username,
                    password: dbCredentials.password,
                    database: `edu_one`,
                    schema: 'collection',
                    entities: [Lecture, LectureStepStatus],
                    synchronize: false,
                    migrationsRun: false,
                    logging: ['error'],
                });

                this.connection = await dataSource.initialize();
            }
            return this.connection;
        } catch (e) {
            console.log('lib->assets->shared->services->database->database->ts, line: 42 => ', e);
            throw Error(ERROR_TYPES.GENERIC_ERROR);
        }
    }
}

export { Database, DataSource };
