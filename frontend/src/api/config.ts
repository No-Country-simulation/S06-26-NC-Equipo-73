import { OpenAPI } from '../contracts/generated/core/OpenAPI';

console.log('API BASE:', OpenAPI.BASE);
console.log('ENV VAR:', import.meta.env.VITE_API_BASE_URL);
OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';