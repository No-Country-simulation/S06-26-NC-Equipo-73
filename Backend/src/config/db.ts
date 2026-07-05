import { Pool } from 'pg';
import { env } from './env.js';
import logger from './logger.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('error', (err: any) => {
    logger.error(`Error inesperado en el cliente PostgreSQL: ${err.message}`);
});

pool.connect()
    .then(client => {
        logger.info('Conexión a la base de datos establecida correctamente');
        client.release();
    })
    .catch(err => {
        logger.error(`Error al conectar a la base de datos: ${err.message}`);
    });
