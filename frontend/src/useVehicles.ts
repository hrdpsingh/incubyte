import { useState, useCallback, useEffect } from "react";
import type { Vehicle, SearchParams } from "./types";
import { buildVehicleSearchUrl } from "./utilities";

export function useVehicles(headers: HeadersInit | (() => HeadersInit)) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [currentParams, setCurrentParams] = useState<SearchParams>({});
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const loadVehicles = useCallback(
        async (params?: SearchParams) => {
            setError(null);
            try {
                const computedHeaders = typeof headers === "function" ? headers() : headers;
                const response = await fetch(buildVehicleSearchUrl(params), {
                    headers: computedHeaders,
                });

                if (!response.ok) {
                    throw new Error("Failed to load vehicles");
                }

                const data = await response.json();
                setVehicles(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load vehicles");
            } finally {
                setLoading(false);
            }
        },
        [headers]
    );

    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    const handleSearch = async (params: SearchParams) => {
        setCurrentParams(params);
        await loadVehicles(params);
    };

    const refetch = useCallback(() => {
        return loadVehicles(currentParams);
    }, [loadVehicles, currentParams]);

    return {
        vehicles,
        loading,
        error,
        setError,
        currentParams,
        handleSearch,
        refetch,
    };
}