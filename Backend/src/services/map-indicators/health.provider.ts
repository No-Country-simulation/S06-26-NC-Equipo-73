import { getDataSource } from '../../database/data-source.js';
import type { IndicatorDefinition, IndicatorProvider, IndicatorQuery, ProviderResult } from './indicator-provider.js';
import { tableExists, valuesByMunicipality } from './indicator-provider.js';

const DEFINITIONS = [
    { code: 'health.hospitalizations', domain: 'health', label: 'Hospitalizaciones', unit: 'hospitalizaciones', aggregation: 'sum', description: 'Cantidad de hospitalizaciones de residentes.' },
    { code: 'health.deaths', domain: 'health', label: 'Defunciones hospitalarias', unit: 'defunciones', aggregation: 'sum', description: 'Hospitalizaciones cuyo egreso indica defunción.' },
    { code: 'health.mortality_rate', domain: 'health', label: 'Mortalidad hospitalaria', unit: '%', aggregation: 'rate', description: 'Porcentaje de hospitalizaciones que terminaron en defunción.' },
    { code: 'health.average_stay', domain: 'health', label: 'Permanencia promedio', unit: 'días', aggregation: 'average', description: 'Promedio de días de permanencia hospitalaria.' },
    { code: 'health.total_cost', domain: 'health', label: 'Costo hospitalario total', unit: 'BRL', aggregation: 'sum', description: 'Suma del valor total de las hospitalizaciones.' },
] as const satisfies readonly IndicatorDefinition[];

const SELECT_EXPRESSIONS: Record<string, string> = {
    'health.hospitalizations': 'COUNT(*)',
    'health.deaths': 'COUNT(*) FILTER (WHERE codigo_indicador_muerte = 1)',
    'health.mortality_rate': '100.0 * COUNT(*) FILTER (WHERE codigo_indicador_muerte = 1) / NULLIF(COUNT(*), 0)',
    'health.average_stay': 'AVG(dias_permanencia)',
    'health.total_cost': 'SUM(valor_total)',
};

export class HealthIndicatorProvider implements IndicatorProvider {
    readonly domain = 'health' as const;
    readonly source = 'RD202402.csv';
    readonly definitions = DEFINITIONS;

    async getValues(query: IndicatorQuery, indicatorCodes: readonly string[]): Promise<ProviderResult> {
        const dataSource = await getDataSource();
        if (!await tableExists(dataSource, 'hospitalizaciones_febrero_2024')) {
            return { observation: { date: null, period: null }, values: new Map() };
        }

        let year: number;
        let month: number;
        if (query.date) {
            year = Number(query.date.slice(0, 4));
            month = Number(query.date.slice(5, 7));
        } else {
            const latest = await dataSource.query<Array<{ year: string; month: string }>>(`
                SELECT anio_competencia AS year, mes_competencia AS month
                FROM hospitalizaciones_febrero_2024
                ORDER BY anio_competencia DESC, mes_competencia DESC
                LIMIT 1
            `);
            if (!latest[0]) return { observation: { date: null, period: null }, values: new Map() };
            year = Number(latest[0].year);
            month = Number(latest[0].month);
        }

        const selectIndicators = indicatorCodes.map((code) => `${SELECT_EXPRESSIONS[code]} AS "${code}"`);
        const rows = await dataSource.query<Array<Record<string, unknown>>>(`
            SELECT codigo_municipio_residencia AS "municipalityCode", ${selectIndicators.join(', ')}
            FROM hospitalizaciones_febrero_2024
            WHERE anio_competencia = $1 AND mes_competencia = $2
            GROUP BY codigo_municipio_residencia
        `, [year, month]);

        return {
            observation: { date: `${year}-${String(month).padStart(2, '0')}-01`, period: 'month' },
            values: valuesByMunicipality(rows, indicatorCodes),
        };
    }
}
