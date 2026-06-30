import { getDataSource } from '../database/data-source.js';
import { TensorConcentrationEntity } from '../database/entities/tensor-concentration.entity.js';
import { ZoneEntity } from '../database/entities/zone.entity.js';

export interface MapRegionRecord {
    region: string;
    lat: number;
    lng: number;
    concentration: number;
    networkCoverage: number;
    profile: string;
}

interface RawMapRegion {
    region: string;
    lat: string;
    lng: string;
    concentration: string;
    networkCoverage: string;
    profile: string;
}

export class MapRepository {
    async findRegions(): Promise<MapRegionRecord[]> {
        const dataSource = await getDataSource();

        const rows = await dataSource
            .getRepository(ZoneEntity)
            .createQueryBuilder('zone')
            .leftJoin(
                TensorConcentrationEntity.options.name,
                'metric',
                'metric.nombre_zona = zone.nombre_zona',
            )
            .select('zone.nombre_zona', 'region')
            .addSelect('zone.latitud', 'lat')
            .addSelect('zone.longitud', 'lng')
            .addSelect('zone.descripcion_perfil', 'profile')
            .addSelect('COALESCE(AVG(metric.cantidad_usuarios), 0)', 'concentration')
            .addSelect(
                'GREATEST(0, LEAST(100, 100 * (1 - COALESCE(AVG(metric.porcentaje_caidas_promedio), 0))))',
                'networkCoverage',
            )
            .groupBy('zone.nombre_zona')
            .addGroupBy('zone.latitud')
            .addGroupBy('zone.longitud')
            .addGroupBy('zone.descripcion_perfil')
            .orderBy('zone.nombre_zona', 'ASC')
            .getRawMany<RawMapRegion>();

        return rows.map((row) => ({
            region: row.region,
            lat: Number(row.lat),
            lng: Number(row.lng),
            concentration: Number(row.concentration),
            networkCoverage: Number(row.networkCoverage),
            profile: row.profile,
        }));
    }
}
