import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { TensorConcentrationEntity } from './entities/tensor-concentration.entity.js';
import { ZoneEntity } from './entities/zone.entity.js';

const dataSource = new DataSource({
    type: 'postgres',
    url: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
    logging: env.DATABASE_LOGGING,
    synchronize: false,
    entities: [ZoneEntity, TensorConcentrationEntity],
});

let initialization: Promise<DataSource> | undefined;

export const getDataSource = async (): Promise<DataSource> => {
    if (dataSource.isInitialized) {
        return dataSource;
    }

    initialization ??= dataSource.initialize().then((initializedDataSource) => {
        logger.info('PostgreSQL connection initialized');
        return initializedDataSource;
    }).catch((error: unknown) => {
        initialization = undefined;
        throw error;
    });

    return initialization;
};

export const closeDataSource = async (): Promise<void> => {
    if (dataSource.isInitialized) {
        await dataSource.destroy();
        logger.info('PostgreSQL connection closed');
    }
};
