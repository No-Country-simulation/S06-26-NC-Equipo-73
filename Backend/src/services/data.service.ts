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
        return this.aiService.generate(request.query);
    }
}
