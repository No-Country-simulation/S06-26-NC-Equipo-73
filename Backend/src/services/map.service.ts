import logger from '../config/logger.js';
import type { MapRepository } from '../repositories/map.repository.js';
import type {
    IndicatorDefinition,
    IndicatorDomain,
    IndicatorObservation,
    IndicatorProvider,
} from './map-indicators/indicator-provider.js';

export interface MapQuery {
    region?: string;
    date?: string;
    period?: string;
    indicators: string[];
}

export interface MapIndicator extends IndicatorDefinition {
    value: number | null;
    status: 'available' | 'no_data';
    source: string;
    observation: IndicatorObservation;
}

export interface MapRegion {
    municipalityCode: number;
    region: string;
    lat: number;
    lng: number;
    profileDescription: string;
    indicators: MapIndicator[];
}

export interface MapResponse {
    appliedFilters: {
        region: string | null;
        date: string | null;
        period: string | null;
        indicators: string[];
    };
    regions: MapRegion[];
}

export interface IndicatorCatalogEntry extends IndicatorDefinition {
    source: string;
}

export class MapService {
    private readonly catalog: IndicatorCatalogEntry[];
    private readonly catalogByCode: Map<string, IndicatorCatalogEntry>;

    constructor(
        private readonly mapRepository: MapRepository,
        private readonly providers: readonly IndicatorProvider[],
    ) {
        this.catalog = providers.flatMap((provider) => provider.definitions.map((definition) => ({
            ...definition,
            source: provider.source,
        })));
        this.catalogByCode = new Map(this.catalog.map((definition) => [definition.code, definition]));

        if (this.catalogByCode.size !== this.catalog.length) {
            throw new Error('Indicator provider codes must be globally unique');
        }
    }

    getIndicatorCatalog(): IndicatorCatalogEntry[] {
        return this.catalog.map((definition) => ({ ...definition }));
    }

    resolveIndicatorCodes(requested: readonly string[] | undefined, domains: readonly IndicatorDomain[]): {
        codes: string[];
        unknown: string[];
    } {
        const candidates = requested?.length ? [...new Set(requested)] : this.catalog.map(({ code }) => code);
        const unknown = candidates.filter((code) => !this.catalogByCode.has(code));
        const codes = candidates.filter((code) => {
            const definition = this.catalogByCode.get(code);
            return definition && (domains.length === 0 || domains.includes(definition.domain));
        });
        return { codes, unknown };
    }

    async getRegions(query: MapQuery): Promise<MapResponse> {
        logger.debug('Map regions requested', query);
        const territories = await this.mapRepository.findTerritories(query.region);
        const selectedCodes = new Set(query.indicators);
        const selectedProviders = this.providers.map((provider) => ({
            provider,
            codes: provider.definitions.map(({ code }) => code).filter((code) => selectedCodes.has(code)),
        })).filter(({ codes }) => codes.length > 0);

        const providerResults = await Promise.all(selectedProviders.map(async ({ provider, codes }) => ({
            provider,
            result: await provider.getValues(
                {
                    ...(query.date ? { date: query.date } : {}),
                    ...(query.period && provider.domain === 'telecommunications' ? { period: query.period } : {}),
                },
                codes,
            ),
        })));

        const resultByCode = new Map<string, {
            provider: IndicatorProvider;
            observation: IndicatorObservation;
            values: Map<number, Map<string, number | null>>;
        }>();
        for (const { provider, result } of providerResults) {
            for (const definition of provider.definitions) {
                if (selectedCodes.has(definition.code)) {
                    resultByCode.set(definition.code, { provider, observation: result.observation, values: result.values });
                }
            }
        }

        const response: MapResponse = {
            appliedFilters: {
                region: query.region ?? null,
                date: query.date ?? null,
                period: query.period ?? null,
                indicators: query.indicators,
            },
            regions: territories.map((territory) => ({
                ...territory,
                indicators: query.indicators.map((code) => {
                    const definition = this.catalogByCode.get(code);
                    const providerResult = resultByCode.get(code);
                    if (!definition || !providerResult) throw new Error(`Unregistered indicator: ${code}`);
                    const value = providerResult.values.get(territory.municipalityCode)?.get(code) ?? null;
                    return {
                        ...definition,
                        value,
                        status: value === null ? 'no_data' as const : 'available' as const,
                        source: providerResult.provider.source,
                        observation: providerResult.observation,
                    };
                }),
            })),
        };

        logger.debug(`Map municipalities retrieved: ${response.regions.length}`);
        return response;
    }
}
