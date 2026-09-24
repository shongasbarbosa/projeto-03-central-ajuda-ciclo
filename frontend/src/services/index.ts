import { realApi } from "./api";
import { demoApi } from "./demo";
import type { ApiService } from "./types";

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

export const api: ApiService = isDemoMode ? demoApi : realApi;

export * from "./types";
