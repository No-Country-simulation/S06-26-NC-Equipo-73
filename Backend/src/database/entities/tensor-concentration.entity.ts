import { EntitySchema } from 'typeorm';

export interface TensorConcentration {
    ecgi: string;
    date: string;
    period: string;
    zoneName: string;
    userCount: number;
    sessionCount: number;
    downloadBytes: string;
    uploadBytes: string;
    averageDurationSeconds: number;
    averageDropPercentage: number;
    averageCongestion: number;
    totalCalls: number;
    totalMessages: number;
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
        sessionCount: {
            name: 'cantidad_sesiones',
            type: Number,
        },
        downloadBytes: {
            name: 'bytes_descarga',
            type: 'bigint',
        },
        uploadBytes: {
            name: 'bytes_subida',
            type: 'bigint',
        },
        averageDurationSeconds: {
            name: 'duracion_promedio_segundos',
            type: 'numeric',
        },
        averageDropPercentage: {
            name: 'porcentaje_caidas_promedio',
            type: 'numeric',
        },
        averageCongestion: {
            name: 'congestion_promedio',
            type: 'numeric',
        },
        totalCalls: {
            name: 'total_llamadas',
            type: Number,
        },
        totalMessages: {
            name: 'total_mensajes',
            type: Number,
        },
    },
});
