import { OpenAPI } from "../contracts/generated";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

export function configureDataAccess() {
  OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}
