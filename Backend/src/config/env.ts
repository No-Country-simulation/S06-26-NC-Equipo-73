import 'dotenv/config';
import { z } from 'zod';
import logger from './logger.js';

const booleanFromString = z
    .enum(['true', 'false'])
    .transform((value) => value === 'true');

const optionalString = z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(8080),
    CORS_ORIGIN: z
        .string()
        .default('http://localhost:5173')
        .transform((value) => value.split(',').map((origin) => origin.trim())),
    SWAGGER_ENABLED: booleanFromString.default(true),
    AI_API_KEY: optionalString,
    AI_MODEL: optionalString,
    AI_BASE_URL: optionalString,
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    DATABASE_URL: z
        .string()
        .trim()
        .min(1)
        .default('postgresql://postgres:postgres@localhost:5432/app-bit'),
    DATABASE_SSL: booleanFromString.default(false),
    DATABASE_LOGGING: booleanFromString.default(false),
});

const parseEnv = () => {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        logger.error(
            `Invalid environment variables: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
        );
        process.exit(1);
    }

    return result.data;
};

export const env = parseEnv();
