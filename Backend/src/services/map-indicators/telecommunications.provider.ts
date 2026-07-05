import { getDataSource } from '../../database/data-source.js';
import type { IndicatorDefinition, IndicatorProvider, IndicatorQuery, ProviderResult } from './indicator-provider.js';
import { tableExists, valuesByMunicipality } from './indicator-provider.js';

const DEFINITIONS = [
    { code: 'telecom.active_users', domain: 'telecommunications', label: 'Usuarios activos', unit: 'usuarios', aggregation: 'average_by_period', description: 'Promedio de usuarios activos por periodo y municipio.' },
    { code: 'telecom.sessions', domain: 'telecommunications', label: 'Sesiones', unit: 'sesiones', aggregation: 'sum', description: 'Total de sesiones registradas.' },
    { code: 'telecom.download_traffic', domain: 'telecommunications', label: 'Tráfico descargado', unit: 'GB', aggregation: 'sum', description: 'Volumen total descargado.' },
    { code: 'telecom.upload_traffic', domain: 'telecommunications', label: 'Tráfico subido', unit: 'GB', aggregation: 'sum', description: 'Volumen total subido.' },
    { code: 'telecom.average_duration', domain: 'telecommunications', label: 'Duración promedio', unit: 'segundos', aggregation: 'weighted_average', description: 'Duración promedio ponderada por sesiones.' },
    { code: 'telecom.drop_rate', domain: 'telecommunications', label: 'Tasa de caídas', unit: '%', aggregation: 'weighted_average', description: 'Porcentaje de caídas ponderado por sesiones.' },
    { code: 'telecom.congestion', domain: 'telecommunications', label: 'Congestión promedio', unit: '%', aggregation: 'weighted_average', description: 'Congestión promedio ponderada por sesiones.' },
    { code: 'telecom.calls', domain: 'telecommunications', label: 'Llamadas', unit: 'llamadas', aggregation: 'sum', description: 'Total de llamadas.' },
    { code: 'telecom.messages', domain: 'telecommunications', label: 'Mensajes', unit: 'mensajes', aggregation: 'sum', description: 'Total de mensajes.' },
] as const satisfies readonly IndicatorDefinition[];

const SELECT_EXPRESSIONS: Record<string, string> = {
    'telecom.active_users': 'SUM(metric.cantidad_usuarios)::numeric / NULLIF(COUNT(DISTINCT metric.periodo), 0)',
    'telecom.sessions': 'SUM(metric.cantidad_sesiones)',
    'telecom.download_traffic': 'SUM(metric.bytes_descarga) / 1073741824.0',
    'telecom.upload_traffic': 'SUM(metric.bytes_subida) / 1073741824.0',
    'telecom.average_duration': 'SUM(metric.duracion_promedio_segundos * metric.cantidad_sesiones) / NULLIF(SUM(metric.cantidad_sesiones), 0)',
    'telecom.drop_rate': '100 * SUM(metric.porcentaje_caidas_promedio * metric.cantidad_sesiones) / NULLIF(SUM(metric.cantidad_sesiones), 0)',
    'telecom.congestion': '100 * SUM(metric.congestion_promedio * metric.cantidad_sesiones) / NULLIF(SUM(metric.cantidad_sesiones), 0)',
    'telecom.calls': 'SUM(metric.total_llamadas)',
    'telecom.messages': 'SUM(metric.total_mensajes)',
};

export class TelecommunicationsIndicatorProvider implements IndicatorProvider {
    readonly domain = 'telecommunications' as const;
    readonly source = 'tensor_concentracao.csv';
    readonly definitions = DEFINITIONS;

    async getValues(query: IndicatorQuery, indicatorCodes: readonly string[]): Promise<ProviderResult> {
        const dataSource = await getDataSource();
        if (!await tableExists(dataSource, 'tensor_concentracion')) {
            return { observation: { date: null, period: query.period ?? null }, values: new Map() };
        }

        let date = query.date ?? null;
        if (!date) {
            const parameters: unknown[] = [];
            const periodCondition = query.period ? 'WHERE periodo = $1' : '';
            if (query.period) parameters.push(query.period);
            const latest = await dataSource.query<Array<{ date: string | null }>>(
                `SELECT MAX(fecha)::text AS date FROM tensor_concentracion ${periodCondition}`,
                parameters,
            );
            date = latest[0]?.date ?? null;
        }

        if (!date) return { observation: { date: null, period: query.period ?? null }, values: new Map() };

        const selectIndicators = indicatorCodes.map((code) => `${SELECT_EXPRESSIONS[code]} AS "${code}"`);
        const parameters: unknown[] = [date];
        let periodCondition = '';
        if (query.period) {
            parameters.push(query.period);
            periodCondition = `AND metric.periodo = $${parameters.length}`;
        }

        const rows = await dataSource.query<Array<Record<string, unknown>>>(`
            SELECT zone.codigo_municipio AS "municipalityCode", ${selectIndicators.join(', ')}
            FROM tensor_concentracion metric
            JOIN zonas zone ON zone.nombre_zona = metric.nombre_zona
            WHERE metric.fecha = $1 ${periodCondition}
            GROUP BY zone.codigo_municipio
        `, parameters);

        return {
            observation: { date, period: query.period ?? null },
            values: valuesByMunicipality(rows, indicatorCodes),
        };
    }
}
