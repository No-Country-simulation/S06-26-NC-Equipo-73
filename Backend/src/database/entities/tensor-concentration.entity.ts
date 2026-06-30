import { EntitySchema } from 'typeorm';

export interface TensorConcentration {
    ecgi: string;
    date: string;
    period: string;
    zoneName: string;
    userCount: number;
    averageDropPercentage: number;
}

export const TensorConcentrationEntity = new EntitySchema<TensorConcentration>({
    name: 'TensorConcentration',
    tableName: 'tensor_concentracion',
    schema: 'public',
    columns: {
        ecgi: {
            type: 'bigint',
            primary: true,
        },
        date: {
            name: 'fecha',
            type: 'date',
            primary: true,
        },
        period: {
            name: 'periodo',
            type: String,
            primary: true,
        },
        zoneName: {
            name: 'nombre_zona',
            type: String,
        },
        userCount: {
            name: 'cantidad_usuarios',
            type: Number,
        },
        averageDropPercentage: {
            name: 'porcentaje_caidas_promedio',
            type: 'numeric',
        },
    },
});
