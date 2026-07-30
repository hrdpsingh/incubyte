import type { SearchParams } from "./types";

export const API = import.meta.env.VITE_API_URL || "";

export function buildVehicleSearchUrl(params?: SearchParams): string {
    let url = `${API}/api/vehicles`;

    if (params) {
        const sp = new URLSearchParams();
        if (params.make) sp.append("make", params.make);
        if (params.model) sp.append("model", params.model);
        if (params.category) sp.append("category", params.category);
        if (params.minPrice) sp.append("min_price", params.minPrice);
        if (params.maxPrice) sp.append("max_price", params.maxPrice);

        if (sp.toString()) {
            url = `${API}/api/vehicles/search?${sp.toString()}`;
        }
    }

    return url;
}

export async function extractError(res: Response, defaultMsg = "Operation failed"): Promise<string> {
    try {
        const data = await res.json();
        return data.detail || defaultMsg;
    } catch {
        return defaultMsg;
    }
}