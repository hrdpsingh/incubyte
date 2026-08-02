import type { SearchParams } from "./types";

export const API = import.meta.env.VITE_API_URL || "";

// Constructs the appropriate vehicle search or list endpoint based on provided search parameters.
export function buildVehicleSearchUrl(params?: SearchParams): string {
    let url = `${API}/api/vehicles`;

    if (params) {
        const sp = new URLSearchParams();

        // Append optional filter criteria to query parameters.
        if (params.query) sp.append("q", params.query);
        if (params.minPrice) sp.append("min_price", params.minPrice);
        if (params.maxPrice) sp.append("max_price", params.maxPrice);

        if (sp.toString()) {
            url = `${API}/api/vehicles/search?${sp.toString()}`;
        }
    }

    return url;
}

// Safely parses error messages from an HTTP response payload with a fallback default.
export async function extractError(res: Response, defaultMsg = "Operation failed"): Promise<string> {
    try {
        const data = await res.json();
        return data.detail || defaultMsg;
    } catch {
        return defaultMsg;
    }
}