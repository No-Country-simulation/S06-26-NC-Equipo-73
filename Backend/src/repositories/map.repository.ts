import { getDataSource } from '../database/data-source.js';
import { ZoneEntity } from '../database/entities/zone.entity.js';

export interface MapTerritoryRecord {
    municipalityCode: number;
    region: string;
    lat: number;
    lng: number;
    profileDescription: string;
}

export interface MapAntennaRecord {
    ecgi: string;
    cluster: string;
    municipalityCode: number;
    municipality: string;
    profileDescription: string;
    lat: number;
    lng: number;
    networkSummary: {
        observationDate: string | null;
        observationPeriod: string | null;
        activeUsers: number | null;
        sessions: number | null;
        congestion: number | null;
        dropRate: number | null;
    };
}

interface RawMapTerritory {
    municipalityCode: string;
    region: string;
    lat: string;
    lng: string;
    profileDescription: string;
}

interface RawMapAntenna {
    ecgi: string;
    cluster: string;
    municipalityCode: string;
    municipality: string;
    profileDescription: string;
    lat: string;
    lng: string;
    activeUsers: string | null;
    sessions: string | null;
    congestion: string | null;
    dropRate: string | null;
}

export class MapRepository {
    async findTerritories(region?: string): Promise<MapTerritoryRecord[]> {
        const dataSource = await getDataSource();
        const query = dataSource
            .getRepository(ZoneEntity)
            .createQueryBuilder('zone')
            .innerJoin('municipios', 'municipality', 'municipality.codigo_municipio_ibge = zone.codigo_municipio')
            .select('municipality.codigo_municipio_ibge', 'municipalityCode')
            .addSelect('municipality.nombre_municipio', 'region')
            .addSelect('AVG(zone.latitud)', 'lat')
            .addSelect('AVG(zone.longitud)', 'lng')
            .addSelect(
                "STRING_AGG(DISTINCT zone.descripcion_perfil, ' / ' ORDER BY zone.descripcion_perfil)",
                'profileDescription',
            )
            .groupBy('municipality.codigo_municipio_ibge')
            .addGroupBy('municipality.nombre_municipio')
            .orderBy('municipality.nombre_municipio', 'ASC');

        if (region) {
            query.where('LOWER(municipality.nombre_municipio) = LOWER(:region)', { region });
        }

        const rows = await query.getRawMany<RawMapTerritory>();
        return rows.map((row) => ({
            municipalityCode: Number(row.municipalityCode),
            region: row.region,
            lat: Number(row.lat),
            lng: Number(row.lng),
            profileDescription: row.profileDescription,
        }));
    }

    async findAntennas(region?: string, date?: string, period?: string): Promise<MapAntennaRecord[]> {
        const dataSource = await getDataSource();
        const latestDateRows = await dataSource.query<Array<{ exists: boolean; date: string | null }>>(`
            SELECT
                to_regclass('public.tensor_concentracion') IS NOT NULL AS exists,
                (
                    SELECT MAX(fecha)::text
                    FROM tensor_concentracion
                    WHERE ($1::text IS NULL OR periodo = $1::text)
                ) AS date
        `, [period ?? null]);
        const tensorExists = latestDateRows[0]?.exists ?? false;
        const observationDate = date ?? latestDateRows[0]?.date ?? null;
        const observationPeriod = period ?? null;
        const metricsJoin = tensorExists ? `
            LEFT JOIN (
                SELECT
                    metric.ecgi::text AS ecgi,
                    SUM(metric.cantidad_usuarios)::numeric / NULLIF(COUNT(DISTINCT metric.periodo), 0) AS "activeUsers",
                    SUM(metric.cantidad_sesiones) AS "sessions",
                    100 * SUM(metric.congestion_promedio * metric.cantidad_sesiones) / NULLIF(SUM(metric.cantidad_sesiones), 0) AS "congestion",
                    100 * SUM(metric.porcentaje_caidas_promedio * metric.cantidad_sesiones) / NULLIF(SUM(metric.cantidad_sesiones), 0) AS "dropRate"
                FROM tensor_concentracion metric
                WHERE $2::text IS NOT NULL
                  AND metric.fecha = $2::date
                  AND ($3::text IS NULL OR metric.periodo = $3::text)
                GROUP BY metric.ecgi
            ) metrics
                ON metrics.ecgi = antenna.ecgi::text
        ` : `
            LEFT JOIN (
                SELECT
                    NULL::text AS ecgi,
                    NULL::numeric AS "activeUsers",
                    NULL::bigint AS "sessions",
                    NULL::numeric AS "congestion",
                    NULL::numeric AS "dropRate"
                WHERE false
            ) metrics
                ON metrics.ecgi = antenna.ecgi::text
        `;

        const rows = await dataSource.query<Array<RawMapAntenna>>(`
            SELECT
                antenna.ecgi::text AS "ecgi",
                antenna.nombre_zona AS "cluster",
                antenna.codigo_municipio AS "municipalityCode",
                municipality.nombre_municipio AS "municipality",
                zone.descripcion_perfil AS "profileDescription",
                antenna.latitud AS "lat",
                antenna.longitud AS "lng",
                metrics."activeUsers" AS "activeUsers",
                metrics."sessions" AS "sessions",
                metrics."congestion" AS "congestion",
                metrics."dropRate" AS "dropRate"
            FROM antenas antenna
            INNER JOIN municipios municipality
                ON municipality.codigo_municipio_ibge = antenna.codigo_municipio
            INNER JOIN zonas zone
                ON zone.nombre_zona = antenna.nombre_zona
            ${metricsJoin}
            WHERE ($1::text IS NULL OR LOWER(municipality.nombre_municipio) = LOWER($1::text))
            ORDER BY municipality.nombre_municipio ASC, antenna.nombre_zona ASC, antenna.ecgi ASC
        `, [region ?? null, tensorExists ? observationDate : null, observationPeriod]);

        return rows.map((row) => ({
            ecgi: row.ecgi,
            cluster: row.cluster,
            municipalityCode: Number(row.municipalityCode),
            municipality: row.municipality,
            profileDescription: row.profileDescription,
            lat: Number(row.lat),
            lng: Number(row.lng),
            networkSummary: {
                observationDate: tensorExists ? observationDate : null,
                observationPeriod,
                activeUsers: row.activeUsers === null ? null : Number(row.activeUsers),
                sessions: row.sessions === null ? null : Number(row.sessions),
                congestion: row.congestion === null ? null : Number(row.congestion),
                dropRate: row.dropRate === null ? null : Number(row.dropRate),
            },
        }));
    }
}
