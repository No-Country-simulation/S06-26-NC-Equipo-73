import assert from 'node:assert/strict';
import test from 'node:test';
import { MapController } from '../dist/controllers/map.controller.js';
import { MapService } from '../dist/services/map.service.js';

const territory = {
    municipalityCode: 4205407,
    region: 'Florianopolis',
    lat: -27.5,
    lng: -48.6,
    profileDescription: 'Centro corporativo / Residencial',
};

const telecomProvider = {
    domain: 'telecommunications',
    source: 'tensor_concentracao.csv',
    definitions: [{
        code: 'telecom.active_users',
        domain: 'telecommunications',
        label: 'Usuarios activos',
        unit: 'usuarios',
        aggregation: 'average_by_period',
        description: 'Promedio de usuarios activos por periodo y municipio.',
    }],
    getValues: async () => ({
        observation: { date: '2026-03-01', period: 'MANHA' },
        values: new Map([[4205407, new Map([['telecom.active_users', 120]])]]),
    }),
};

const healthProvider = {
    domain: 'health',
    source: 'RD202402.csv',
    definitions: [{
        code: 'health.hospitalizations',
        domain: 'health',
        label: 'Hospitalizaciones',
        unit: 'hospitalizaciones',
        aggregation: 'sum',
        description: 'Cantidad de hospitalizaciones de residentes.',
    }],
    getValues: async () => ({
        observation: { date: '2024-02-01', period: 'month' },
        values: new Map([[4205407, new Map([['health.hospitalizations', 32]])]]),
    }),
};

const createService = () => new MapService(
    { findTerritories: async () => [territory] },
    [telecomProvider, healthProvider],
);

test('map combines providers through municipality with source-specific observations', async () => {
    const response = await createService().getRegions({
        indicators: ['telecom.active_users', 'health.hospitalizations'],
    });

    assert.equal(response.regions[0].municipalityCode, 4205407);
    assert.equal(response.regions[0].profileDescription, territory.profileDescription);
    assert.deepEqual(response.regions[0].indicators.map(({ code, value, source, observation }) => ({
        code, value, source, observation,
    })), [
        {
            code: 'telecom.active_users',
            value: 120,
            source: 'tensor_concentracao.csv',
            observation: { date: '2026-03-01', period: 'MANHA' },
        },
        {
            code: 'health.hospitalizations',
            value: 32,
            source: 'RD202402.csv',
            observation: { date: '2024-02-01', period: 'month' },
        },
    ]);
});

test('indicator selection supports domains and rejects unknown codes', () => {
    const service = createService();
    assert.deepEqual(service.resolveIndicatorCodes(undefined, ['health']), {
        codes: ['health.hospitalizations'],
        unknown: [],
    });
    assert.deepEqual(service.resolveIndicatorCodes(['unknown'], []), {
        codes: [],
        unknown: ['unknown'],
    });
});

test('map controller parses domain filters and exposes the catalog', async () => {
    const service = createService();
    const controller = new MapController(service);
    const createResponse = () => ({
        statusCode: 0,
        body: undefined,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    });

    const response = createResponse();
    await controller.getMap({ query: { domains: 'health' } }, response);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.appliedFilters.indicators, ['health.hospitalizations']);

    const catalogResponse = createResponse();
    controller.getIndicators({}, catalogResponse);
    assert.equal(catalogResponse.statusCode, 200);
    assert.equal(catalogResponse.body.indicators.length, 2);
});
