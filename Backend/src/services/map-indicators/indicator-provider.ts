import type { DataSource } from 'typeorm';

export type IndicatorDomain = 'telecommunications' | 'health' | 'employment';
export type IndicatorAggregation = 'sum' | 'weighted_average' | 'average' | 'average_by_period' | 'rate';

export interface IndicatorDefinition {
    code: string;
    domain: IndicatorDomain;
    label: string;
    unit: string;
    aggregation: IndicatorAggregation;
    description: string;
}

export interface IndicatorQuery {
    date?: string;
    period?: string;
}

export interface IndicatorObservation {
    date: string | null;
    period: string | null;
}

export interface ProviderResult {
    observation: IndicatorObservation;
    values: Map<number, Map<string, number | null>>;
}

export interface IndicatorProvider {
    readonly domain: IndicatorDomain;
    readonly source: string;
    readonly definitions: readonly IndicatorDefinition[];
    getValues(query: IndicatorQuery, indicatorCodes: readonly string[]): Promise<ProviderResult>;
}

export const tableExists = async (dataSource: DataSource, table: string): Promise<boolean> => {
    const rows = await dataSource.query<Array<{ exists: boolean }>>(
        'SELECT to_regclass($1) IS NOT NULL AS exists',
        [`public.${table}`],
    );
    return rows[0]?.exists ?? false;
};

export const toNullableNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const valuesByMunicipality = (
    rows: Array<Record<string, unknown>>,
    codes: readonly string[],
): Map<number, Map<string, number | null>> => new Map(rows.map((row) => [
    Number(row.municipalityCode),
    new Map(codes.map((code) => [code, toNullableNumber(row[code])])),
]));
