import { EntitySchema } from 'typeorm';

export interface Zone {
    name: string;
    municipalityCode: number;
    latitude: number;
    longitude: number;
    profileDescription: string;
    source: string;
}

export const ZoneEntity = new EntitySchema<Zone>({
    name: 'Zone',
    tableName: 'zonas',
    schema: 'public',
    columns: {
        name: {
            name: 'nombre_zona',
            type: String,
            primary: true,
        },
        municipalityCode: {
            name: 'codigo_municipio',
            type: Number,
        },
        latitude: {
            name: 'latitud',
            type: 'numeric',
        },
        longitude: {
            name: 'longitud',
            type: 'numeric',
        },
        profileDescription: {
            name: 'descripcion_perfil',
            type: String,
        },
        source: {
            name: 'fuente',
            type: String,
        },
    },
});
