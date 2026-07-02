import { getDataSource } from '../database/data-source.js';
import { ZoneEntity } from '../database/entities/zone.entity.js';

export interface MapTerritoryRecord {
    municipalityCode: number;
    region: string;
    lat: number;
    lng: number;
    profileDescription: string;
}

interface RawMapTerritory {
    municipalityCode: string;
    region: string;
    lat: string;
    lng: string;
    profileDescription: string;
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
}
