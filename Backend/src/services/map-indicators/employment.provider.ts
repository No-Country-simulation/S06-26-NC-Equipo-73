import { getDataSource } from '../../database/data-source.js';
import type { IndicatorDefinition, IndicatorProvider, IndicatorQuery, ProviderResult } from './indicator-provider.js';
import { tableExists, valuesByMunicipality } from './indicator-provider.js';

const DEFINITIONS = [
    { code: 'employment.hires', domain: 'employment', label: 'Contrataciones', unit: 'movimientos', aggregation: 'sum', description: 'Movimientos laborales con balance positivo.' },
    { code: 'employment.dismissals', domain: 'employment', label: 'Desvinculaciones', unit: 'movimientos', aggregation: 'sum', description: 'Movimientos laborales con balance negativo.' },
    { code: 'employment.net_change', domain: 'employment', label: 'Saldo de empleo', unit: 'puestos', aggregation: 'sum', description: 'Contrataciones menos desvinculaciones.' },
    { code: 'employment.average_salary', domain: 'employment', label: 'Salario mensual promedio', unit: 'BRL', aggregation: 'average', description: 'Promedio del salario mensual informado.' },
    { code: 'employment.average_contracted_hours', domain: 'employment', label: 'Horas contratadas promedio', unit: 'horas', aggregation: 'average', description: 'Promedio de horas contratadas.' },
] as const satisfies readonly IndicatorDefinition[];

const SELECT_EXPRESSIONS: Record<string, string> = {
    'employment.hires': 'COUNT(*) FILTER (WHERE balance_movimiento > 0)',
    'employment.dismissals': 'COUNT(*) FILTER (WHERE balance_movimiento < 0)',
    'employment.net_change': 'SUM(balance_movimiento)',
    'employment.average_salary': 'AVG(salario_mensual)',
    'employment.average_contracted_hours': 'AVG(horas_contratadas)',
};

export class EmploymentIndicatorProvider implements IndicatorProvider {
    readonly domain = 'employment' as const;
    readonly source = 'CAGEDEST_012019.csv';
    readonly definitions = DEFINITIONS;

    async getValues(query: IndicatorQuery, indicatorCodes: readonly string[]): Promise<ProviderResult> {
        const dataSource = await getDataSource();
        if (!await tableExists(dataSource, 'movimientos_laborales_201901')) {
            return { observation: { date: null, period: null }, values: new Map() };
        }

        let period: number;
        if (query.date) {
            period = Number(`${query.date.slice(0, 4)}${query.date.slice(5, 7)}`);
        } else {
            const latest = await dataSource.query<Array<{ period: string | null }>>(
                'SELECT MAX(periodo_declarado) AS period FROM movimientos_laborales_201901',
            );
            if (!latest[0]?.period) return { observation: { date: null, period: null }, values: new Map() };
            period = Number(latest[0].period);
        }

        const selectIndicators = indicatorCodes.map((code) => `${SELECT_EXPRESSIONS[code]} AS "${code}"`);
        const rows = await dataSource.query<Array<Record<string, unknown>>>(`
            SELECT codigo_municipio AS "municipalityCode", ${selectIndicators.join(', ')}
            FROM movimientos_laborales_201901
            WHERE periodo_declarado = $1
            GROUP BY codigo_municipio
        `, [period]);
        const periodText = String(period).padStart(6, '0');

        return {
            observation: { date: `${periodText.slice(0, 4)}-${periodText.slice(4, 6)}-01`, period: 'month' },
            values: valuesByMunicipality(rows, indicatorCodes),
        };
    }
}
