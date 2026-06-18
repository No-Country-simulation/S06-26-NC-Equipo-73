import logger from '../config/logger.js';
import type { AIService } from './ai.service.js';

export interface DataQuery {
    query: string;
    filters: {
        region: string;
        indicator: string;
    };
    language: string;
}

export interface DataPoint {
    region: string;
    value: number;
    source: string;
}

export interface DataResponse {
    aiResponse: string;
    dataPoints: DataPoint[];
    sources: string[];
}

export class DataService {
    constructor(private readonly aiService: AIService) {}

    async query(request: DataQuery): Promise<DataResponse> {
        logger.info(
            `Data query started for region "${request.filters.region}" and indicator "${request.filters.indicator}"`,
        );

        try {
            const response = await this.aiService.generate(request.query);

            logger.info(
                `Data query completed with ${response.dataPoints.length} data points and ${response.sources.length} sources`,
            );

            return response;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Data query failed: ${message}`);
            throw error;
        }
    }
}
