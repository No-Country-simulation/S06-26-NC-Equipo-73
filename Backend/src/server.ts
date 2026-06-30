import app from './app.js';
import { env } from './config/env.js';
import logger from './config/logger.js';
import { closeDataSource } from './database/data-source.js';

const server = app.listen(env.PORT, env.HOST, () => {
    logger.info(`Servidor corriendo en http://${env.HOST}:${env.PORT}`);
});

server.on('error', (error) => {
    logger.error(`Error al iniciar el servidor: ${error}`);
});

server.on('close', async () => {
    await closeDataSource();
    logger.info('Se ha cerrado el servidor');
});

process.on('SIGINT', () => {
    server.close();
});

process.on('SIGTERM', () => {
    server.close();
});

export default server;
