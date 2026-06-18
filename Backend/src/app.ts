import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './config/env.js';
import { createContainer } from './container.js';
import { createRoutes } from './routes/index.js';

//Importando para crear las rutas

const app = express();

// Opciónes de Cors, definimos que dominio puede consumir las APIs y qué métodos HTTP están permitidos.
const corsOptions = {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
};

// Opciónes de Swagger para generar la documentación. Definimos versión estandar de OpenApi y la información que se va a ver en la interfaz gráfica.
// Así mismo, mediante el atributo "apis:", le decimos a Swagger donde buscar todos los archivos con las rutas.
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'APIs NoCountry',
            version: '1.0.0'
        },
    },
    apis: ['./src/routes/*.ts']
};
const swaggerSpec = swaggerJSDoc(options);
const container = await createContainer();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

if (env.SWAGGER_ENABLED) {
    app.get('/swagger.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Creando las rutas
app.use('/api', createRoutes(container));

export default app;
